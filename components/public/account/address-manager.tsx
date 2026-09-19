"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  Plus,
  MapPin,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  Phone,
  User,
  Home,
  CheckCircle2,
} from "lucide-react";
import {
  customerAddressSchema,
  type CustomerAddressInput,
} from "@/lib/validations/customer.schema";
import {
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
} from "@/lib/actions/customer.actions";
import { BackButton } from "@/components/public/ui/back-button";

export interface AddressItem {
  _id?: string;
  name: string;
  phone: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface AddressManagerProps {
  addresses: AddressItem[];
}

export default function AddressManager({
  addresses: initialAddresses,
}: AddressManagerProps) {
  const [addresses, setAddresses] = useState<AddressItem[]>(initialAddresses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerAddressInput>({
    resolver: zodResolver(customerAddressSchema),
    defaultValues: {
      name: "",
      phone: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
      country: "India",
      isDefault: false,
    },
  });

  const handleOpenAdd = () => {
    setEditingAddress(null);
    reset({
      name: "",
      phone: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
      country: "India",
      isDefault: addresses.length === 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: AddressItem) => {
    setEditingAddress(addr);
    reset({
      name: addr.name,
      phone: addr.phone,
      street1: addr.street1,
      street2: addr.street2 || "",
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country || "India",
      isDefault: addresses[0]?._id === addr._id,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
    reset();
  };

  const onSubmit = async (data: CustomerAddressInput) => {
    setIsSubmitting(true);
    try {
      if (editingAddress && editingAddress._id) {
        const res = await updateCustomerAddress(editingAddress._id, data);
        if (res.success && res.data) {
          setAddresses(res.data);
          toast.success("Address updated successfully!");
          handleCloseModal();
        } else {
          toast.error(res.error || "Failed to update address");
        }
      } else {
        const res = await addCustomerAddress(data);
        if (res.success && res.data) {
          setAddresses(res.data);
          toast.success("Address added successfully!");
          handleCloseModal();
        } else {
          toast.error(res.error || "Failed to add address");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    setIsDeletingId(id);
    try {
      const res = await deleteCustomerAddress(id);
      if (res.success && res.data) {
        setAddresses(res.data);
        toast.success("Address deleted successfully!");
      } else {
        toast.error(res.error || "Failed to delete address");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete address");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSetDefault = async (id?: string) => {
    if (!id) return;
    try {
      const res = await setDefaultCustomerAddress(id);
      if (res.success && res.data) {
        setAddresses(res.data);
        toast.success("Default address updated!");
      } else {
        toast.error(res.error || "Failed to update default address");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update default address");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="bg-white rounded-2xl border border-plum-100 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-plum-100 bg-plum-50/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <BackButton fallbackHref="/account/dashboard" label="Back to Dashboard" className="mb-3" />
            <h1 className="text-2xl font-bold font-display text-plum-950">
              Saved Addresses
            </h1>
            <p className="text-sm text-plum-600 mt-1">
              Manage your delivery addresses for seamless checkout.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-plum-900 px-4 py-2.5 text-sm font-semibold text-gold-400 hover:bg-plum-800 transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={18} />
            <span>Add New Address</span>
          </button>
        </div>

        {/* Address Cards List */}
        <div className="p-6 sm:p-8">
          {addresses.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-plum-100 rounded-2xl bg-plum-50/20">
              <MapPin className="mx-auto h-12 w-12 text-plum-300 mb-3" />
              <h3 className="text-lg font-semibold text-plum-900">
                No addresses saved yet
              </h3>
              <p className="mt-1 text-sm text-plum-500 max-w-sm mx-auto">
                Add your delivery address now so your next checkout is just a
                single click away.
              </p>
              <button
                onClick={handleOpenAdd}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold-500 px-5 py-2.5 text-sm font-semibold text-plum-950 hover:bg-gold-400 transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={16} />
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((address, index) => {
                const isDefault = index === 0;
                const addrId = address._id?.toString();
                const isDeleting = isDeletingId === addrId;

                return (
                  <div
                    key={addrId || index}
                    className={`relative rounded-2xl border transition-all p-6 flex flex-col justify-between ${
                      isDefault
                        ? "border-gold-300 bg-gradient-to-br from-gold-50/20 to-white shadow-sm"
                        : "border-plum-100 bg-white hover:border-plum-200 hover:shadow-md"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {isDefault ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-2.5 py-1 text-xs font-semibold text-plum-900">
                            <CheckCircle2 size={13} className="text-gold-600" />
                            Default Shipping
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefault(addrId)}
                            className="text-xs text-plum-500 hover:text-gold-600 font-medium transition-colors cursor-pointer"
                          >
                            Set as default
                          </button>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(address)}
                            className="p-1.5 text-plum-500 hover:text-plum-900 hover:bg-plum-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Address"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(addrId)}
                            disabled={isDeleting}
                            className="p-1.5 text-plum-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete Address"
                          >
                            {isDeleting ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-plum-950 text-base flex items-center gap-2">
                        {address.name}
                      </h3>
                      <p className="text-plum-600 text-xs mt-1 flex items-center gap-1.5">
                        <Phone size={12} className="text-plum-400" />
                        {address.phone}
                      </p>

                      <div className="mt-3.5 text-sm text-plum-700 space-y-0.5 leading-relaxed">
                        <p>{address.street1}</p>
                        {address.street2 && (
                          <p className="text-plum-500 text-xs">
                            {address.street2}
                          </p>
                        )}
                        <p className="font-medium text-plum-900">
                          {address.city}, {address.state} - {address.zip}
                        </p>
                        <p className="text-xs text-plum-500">{address.country}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-plum-100 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-plum-100 bg-plum-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-plum-900 text-gold-400 flex items-center justify-center">
                  <Home size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-plum-950">
                    {editingAddress ? "Edit Address" : "Add New Address"}
                  </h3>
                  <p className="text-xs text-plum-500">
                    {editingAddress
                      ? "Update your existing delivery details"
                      : "Enter address details for delivery"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-plum-400 hover:text-plum-700 rounded-xl hover:bg-plum-100/60 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-plum-800 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      {...register("name")}
                      placeholder="e.g. Priya Sharma"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-plum-950 placeholder:text-plum-300 focus:outline-hidden focus:ring-2 transition-all ${
                        errors.name
                          ? "border-red-400 focus:ring-red-200"
                          : "border-plum-200 focus:border-gold-500 focus:ring-gold-200"
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-plum-800 mb-1">
                    Phone Number *
                  </label>
                  <input
                    {...register("phone")}
                    placeholder="10-digit mobile number"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-plum-950 placeholder:text-plum-300 focus:outline-hidden focus:ring-2 transition-all ${
                      errors.phone
                        ? "border-red-400 focus:ring-red-200"
                        : "border-plum-200 focus:border-gold-500 focus:ring-gold-200"
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-plum-800 mb-1">
                  Street Address / House No. / Building *
                </label>
                <input
                  {...register("street1")}
                  placeholder="e.g. Flat 402, Royal Palms Apartments"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-plum-950 placeholder:text-plum-300 focus:outline-hidden focus:ring-2 transition-all ${
                    errors.street1
                      ? "border-red-400 focus:ring-red-200"
                      : "border-plum-200 focus:border-gold-500 focus:ring-gold-200"
                  }`}
                />
                {errors.street1 && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.street1.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-plum-800 mb-1">
                  Apartment, Suite, Landmark (Optional)
                </label>
                <input
                  {...register("street2")}
                  placeholder="e.g. Near City Center Mall"
                  className="w-full rounded-xl border border-plum-200 px-3.5 py-2.5 text-sm text-plum-950 placeholder:text-plum-300 focus:outline-hidden focus:border-gold-500 focus:ring-2 focus:ring-gold-200 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-plum-800 mb-1">
                    City *
                  </label>
                  <input
                    {...register("city")}
                    placeholder="e.g. Mumbai"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-plum-950 placeholder:text-plum-300 focus:outline-hidden focus:ring-2 transition-all ${
                      errors.city
                        ? "border-red-400 focus:ring-red-200"
                        : "border-plum-200 focus:border-gold-500 focus:ring-gold-200"
                    }`}
                  />
                  {errors.city && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-plum-800 mb-1">
                    State *
                  </label>
                  <input
                    {...register("state")}
                    placeholder="e.g. Maharashtra"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-plum-950 placeholder:text-plum-300 focus:outline-hidden focus:ring-2 transition-all ${
                      errors.state
                        ? "border-red-400 focus:ring-red-200"
                        : "border-plum-200 focus:border-gold-500 focus:ring-gold-200"
                    }`}
                  />
                  {errors.state && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.state.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-plum-800 mb-1">
                    PIN Code *
                  </label>
                  <input
                    {...register("zip")}
                    placeholder="e.g. 400001"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-plum-950 placeholder:text-plum-300 focus:outline-hidden focus:ring-2 transition-all ${
                      errors.zip
                        ? "border-red-400 focus:ring-red-200"
                        : "border-plum-200 focus:border-gold-500 focus:ring-gold-200"
                    }`}
                  />
                  {errors.zip && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.zip.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-plum-800 mb-1">
                  Country
                </label>
                <input
                  {...register("country")}
                  readOnly
                  className="w-full rounded-xl border border-plum-200 bg-plum-50/50 px-3.5 py-2.5 text-sm text-plum-600 focus:outline-hidden cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register("isDefault")}
                    className="size-4 rounded border-plum-300 text-plum-900 focus:ring-gold-500 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-plum-700">
                    Make this my default shipping address
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-plum-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-plum-200 text-sm font-medium text-plum-700 hover:bg-plum-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-plum-900 text-sm font-semibold text-gold-400 hover:bg-plum-800 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{editingAddress ? "Save Changes" : "Save Address"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
