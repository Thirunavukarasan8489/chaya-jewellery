"use server";

import dbConnect from "@/lib/db";
import { Customer } from "@/lib/models/customer";
import { getSession } from "@/lib/auth";

// Helper to check auth
async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Normalize roles to match DB ENUMS (SUPER_ADMIN, etc.)
  const normRoles = allowedRoles.map((r) => r.replace(" ", "_").toUpperCase());
  if (!normRoles.includes(session.role as string)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
  return session;
}

export async function getCustomers(type?: "PERSONAL" | "BUSINESS") {
  try {
    const isAuth = await checkAuth([
      "Super Admin",
      "Content Manager",
      "Lead Manager",
    ]);
    if (!isAuth) return { success: false, error: "Unauthorized" };

    await dbConnect();

    const query = type ? { type } : {};
    const customers = await Customer.find(query).sort({ updatedAt: -1 }).lean();

    return { success: true, data: JSON.parse(JSON.stringify(customers)) };
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return { success: false, error: error.message };
  }
}

export async function getCustomerById(id: string) {
  try {
    const isAuth = await checkAuth([
      "Super Admin",
      "Content Manager",
      "Lead Manager",
    ]);
    if (!isAuth) return { success: false, error: "Unauthorized" };

    await dbConnect();

    const customer = await Customer.findById(id).lean();
    if (!customer) return { success: false, error: "Customer not found" };

    return { success: true, data: JSON.parse(JSON.stringify(customer)) };
  } catch (error: any) {
    console.error("Error fetching customer:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCustomerProfile(
  userId: string,
  data: { firstName: string; lastName: string; phone: string },
) {
  try {
    const session = await getSession();
    if (!session || session.userId !== userId) throw new Error("Unauthorized");

    await dbConnect();

    // Update Customer Profile
    let updatedCustomer = await Customer.findOneAndUpdate(
      { userId },
      {
        $set: {
          "profile.firstName": data.firstName,
          "profile.lastName": data.lastName,
          "contact.phone": data.phone,
        },
      },
      { returnDocument: "after" },
    );

    if (!updatedCustomer && session.email) {
      updatedCustomer = await Customer.findOneAndUpdate(
        { "contact.email": session.email },
        {
          $set: {
            userId,
            "profile.firstName": data.firstName,
            "profile.lastName": data.lastName,
            "contact.phone": data.phone,
          },
        },
        { returnDocument: "after" },
      );
    }

    if (!updatedCustomer) {
      // Auto-create customer profile if it does not exist yet
      const created = await Customer.create({
        userId,
        type: "PERSONAL",
        contact: { email: session.email || "", phone: data.phone },
        profile: { firstName: data.firstName, lastName: data.lastName },
        addresses: [],
        metrics: { totalOrders: 0, totalSpend: 0 },
      });
      updatedCustomer = created;
    }

    revalidatePath("/account/profile");
    revalidatePath("/account/dashboard");

    return { success: true, data: JSON.parse(JSON.stringify(updatedCustomer)) };
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return { success: false, error: error.message };
  }
}

import { revalidatePath } from "next/cache";
import {
  customerAddressSchema,
  type CustomerAddressInput,
} from "@/lib/validations/customer.schema";
import { User } from "@/lib/models/user";

export async function addCustomerAddress(data: CustomerAddressInput) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return {
        success: false,
        error: "You must be logged in to add an address",
      };
    }

    const parsed = customerAddressSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid address data",
      };
    }

    await dbConnect();

    let customer = await Customer.findOne({ userId: session.userId });

    if (!customer) {
      // Find user email if available
      const userDoc = await User.findById(session.userId).lean();
      const email = userDoc?.email;
      if (email) {
        customer = await Customer.findOne({ "contact.email": email });
        if (customer) {
          customer.userId = session.userId;
        }
      }

      if (!customer) {
        customer = new Customer({
          userId: session.userId,
          type: "PERSONAL",
          contact: { email: email || "", phone: parsed.data.phone },
          profile: {
            firstName: session.name?.split(" ")[0] || "Customer",
            lastName: session.name?.split(" ").slice(1).join(" ") || "",
          },
          addresses: [],
        });
      }
    }

    const newAddress = {
      name: parsed.data.name,
      phone: parsed.data.phone,
      street1: parsed.data.street1,
      street2: parsed.data.street2 || "",
      city: parsed.data.city,
      state: parsed.data.state,
      zip: parsed.data.zip,
      country: parsed.data.country || "India",
    };

    if (
      parsed.data.isDefault ||
      !customer.addresses ||
      customer.addresses.length === 0
    ) {
      customer.addresses = [newAddress, ...(customer.addresses || [])];
    } else {
      customer.addresses.push(newAddress);
    }

    // Also ensure customer has contact phone if missing
    if (!customer.contact?.phone) {
      if (!customer.contact) customer.contact = {};
      customer.contact.phone = parsed.data.phone;
    }

    await customer.save();
    revalidatePath("/account/addresses");
    revalidatePath("/account/dashboard");

    return {
      success: true,
      data: JSON.parse(JSON.stringify(customer.addresses)),
    };
  } catch (error: any) {
    console.error("Error adding address:", error);
    return { success: false, error: error.message || "Failed to add address" };
  }
}

export async function updateCustomerAddress(
  addressId: string,
  data: CustomerAddressInput,
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = customerAddressSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid address data",
      };
    }

    await dbConnect();

    const customer = await Customer.findOne({ userId: session.userId });
    if (!customer) {
      return { success: false, error: "Customer profile not found" };
    }

    const address = customer.addresses.id(addressId);
    if (!address) {
      return { success: false, error: "Address not found" };
    }

    address.name = parsed.data.name;
    address.phone = parsed.data.phone;
    address.street1 = parsed.data.street1;
    address.street2 = parsed.data.street2 || "";
    address.city = parsed.data.city;
    address.state = parsed.data.state;
    address.zip = parsed.data.zip;
    address.country = parsed.data.country || "India";

    if (parsed.data.isDefault) {
      const idx = customer.addresses.findIndex(
        (a: any) => a._id.toString() === addressId,
      );
      if (idx > 0) {
        const [moved] = customer.addresses.splice(idx, 1);
        customer.addresses.unshift(moved);
      }
    }

    await customer.save();
    revalidatePath("/account/addresses");
    revalidatePath("/account/dashboard");

    return {
      success: true,
      data: JSON.parse(JSON.stringify(customer.addresses)),
    };
  } catch (error: any) {
    console.error("Error updating address:", error);
    return {
      success: false,
      error: error.message || "Failed to update address",
    };
  }
}

export async function deleteCustomerAddress(addressId: string) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();

    const customer = await Customer.findOne({ userId: session.userId });
    if (!customer) {
      return { success: false, error: "Customer profile not found" };
    }

    customer.addresses.pull({ _id: addressId });
    await customer.save();

    revalidatePath("/account/addresses");
    revalidatePath("/account/dashboard");

    return {
      success: true,
      data: JSON.parse(JSON.stringify(customer.addresses)),
    };
  } catch (error: any) {
    console.error("Error deleting address:", error);
    return {
      success: false,
      error: error.message || "Failed to delete address",
    };
  }
}

export async function setDefaultCustomerAddress(addressId: string) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();

    const customer = await Customer.findOne({ userId: session.userId });
    if (!customer) {
      return { success: false, error: "Customer profile not found" };
    }

    const idx = customer.addresses.findIndex(
      (a: any) => a._id.toString() === addressId,
    );
    if (idx < 0) {
      return { success: false, error: "Address not found" };
    }

    if (idx > 0) {
      const [moved] = customer.addresses.splice(idx, 1);
      customer.addresses.unshift(moved);
      await customer.save();
    }

    revalidatePath("/account/addresses");
    revalidatePath("/account/dashboard");

    return {
      success: true,
      data: JSON.parse(JSON.stringify(customer.addresses)),
    };
  } catch (error: any) {
    console.error("Error setting default address:", error);
    return {
      success: false,
      error: error.message || "Failed to set default address",
    };
  }
}
