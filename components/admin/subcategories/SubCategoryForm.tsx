"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ArrowLeft, UploadCloud } from "lucide-react";
import { createSubCategory, updateSubCategory } from "@/lib/actions/sub-category.actions";
import { uploadMedia } from "@/lib/actions/media.actions";
import { AdminSelect } from "@/components/admin/ui/AdminSelect";
import { toast } from "react-hot-toast";

export default function SubCategoryForm({
  initialData,
  categories,
  subCategories
}: {
  initialData?: any;
  categories: { label: string; value: string }[];
  subCategories: { label: string; value: string }[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "",
    type: initialData?.type || "SINGLE",
    comboIncludes: initialData?.comboIncludes || [],
    comboDiscount: initialData?.comboDiscount || 0,
    description: initialData?.description || "",
    status: initialData?.status || "ACTIVE",
    metaTitle: initialData?.metaTitle || "",
    metaDescription: initialData?.metaDescription || "",
    image: initialData?.image || "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(initialData?.image || "");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, image: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalImageUrl = formData.image;

      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append("file", selectedFile);

        const uploadResult = await uploadMedia(uploadData);
        if (uploadResult.success && uploadResult.data) {
          finalImageUrl = uploadResult.data.secureUrl || uploadResult.data.url;
        } else {
          throw new Error(uploadResult.error || "Failed to upload image");
        }
      }

      const categoryData = {
        ...formData,
        image: finalImageUrl,
      };

      const savePromise = initialData?._id
        ? updateSubCategory(initialData._id, categoryData)
        : createSubCategory(categoryData);

      toast
        .promise(
          savePromise.then((res) => {
            if (!res.success) throw new Error(res.error);
            return res;
          }),
          {
            loading: "Saving...",
            success: initialData
              ? "SubCategory updated successfully"
              : "SubCategory created successfully",
            error: (err) => err.message || "Failed to save subcategory",
          },
        )
        .then(() => {
          setTimeout(() => {
            router.push("/admin/subcategories");
          }, 1000);
        })
        .catch(() => {
          setIsSubmitting(false);
        });
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/subcategories"
            className="p-2 border border-gold-200 dark:border-gold-700 rounded-md text-gold-500 hover:bg-white dark:hover:bg-gold-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gold-800 dark:text-white">
              {initialData ? "Edit SubCategory" : "Create SubCategory"}
            </h1>
            <p className="text-sm text-gold-500 dark:text-gold-400 mt-1">
              {initialData
                ? "Update the subcategory details"
                : "Add a new subcategory to your catalogue"}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSubmitting
            ? "Saving..."
            : initialData
              ? "Update SubCategory"
              : "Save SubCategory"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gold-800 dark:text-white mb-4">
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                  Parent Category *
                </label>
                <AdminSelect
                  name="category"
                  value={categories.find((o) => o.value === (typeof formData.category === 'object' ? formData.category._id : formData.category)) || null}
                  onChange={(opt: any) =>
                    handleChange({
                      target: {
                        name: "category",
                        value: opt ? opt.value : "",
                      },
                    } as any)
                  }
                  options={categories}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                  SubCategory Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gold-200 dark:border-gold-700 rounded-md bg-white text-gold-800 dark:text-gold-200 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-colors"
                  placeholder="e.g. Bridal Necklaces"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gold-200 dark:border-gold-700 rounded-md bg-white text-gold-800 dark:text-gold-200 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-colors"
                  placeholder="Describe the subcategory..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gold-800 dark:text-white mb-4">
              Type & Combo Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                  Type
                </label>
                <AdminSelect
                  name="type"
                  value={
                    [
                      { value: "SINGLE", label: "Single" },
                      { value: "COMBO", label: "Combo" },
                    ].find((o) => o.value === formData.type) || { value: "SINGLE", label: "Single" }
                  }
                  onChange={(opt: any) =>
                    handleChange({
                      target: {
                        name: "type",
                        value: opt ? opt.value : "SINGLE",
                      },
                    } as any)
                  }
                  options={[
                    { value: "SINGLE", label: "Single" },
                    { value: "COMBO", label: "Combo" },
                  ]}
                />
              </div>

              {formData.type === "COMBO" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                      Combo Includes (Select SubCategories)
                    </label>
                    <div className="flex flex-col gap-2 border border-gold-200 dark:border-gold-700 p-3 rounded-md max-h-48 overflow-y-auto">
                      {subCategories.filter(sc => sc.value !== initialData?._id).map((sc) => (
                        <label key={sc.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.comboIncludes.includes(sc.value)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData((prev) => {
                                const newIncludes = checked
                                  ? [...prev.comboIncludes, sc.value]
                                  : prev.comboIncludes.filter((id: string) => id !== sc.value);
                                return { ...prev, comboIncludes: newIncludes };
                              });
                            }}
                            className="rounded text-gold-600 focus:ring-gold-500"
                          />
                          <span className="text-sm text-gold-800 dark:text-gold-200">{sc.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                      Combo Discount
                    </label>
                    <input
                      type="text"
                      name="comboDiscount"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      value={formData.comboDiscount}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gold-200 dark:border-gold-700 rounded-md bg-white text-gold-800 dark:text-gold-200 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-colors"
                      placeholder="e.g. 10 for 10% or a fixed value"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gold-800 dark:text-white mb-4">
              Search Engine Optimization
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gold-200 dark:border-gold-700 rounded-md bg-white text-gold-800 dark:text-gold-200 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-colors"
                  placeholder="Leave blank to use subcategory name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                  Meta Description
                </label>
                <textarea
                  name="metaDescription"
                  rows={3}
                  value={formData.metaDescription}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gold-200 dark:border-gold-700 rounded-md bg-white text-gold-800 dark:text-gold-200 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gold-800 dark:text-white mb-4">
              Status
            </h3>
            <div>
              <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                Visibility
              </label>
              <AdminSelect
                name="status"
                value={
                  [
                    { value: "ACTIVE", label: "Active (Visible)" },
                    { value: "DRAFT", label: "Draft (Hidden)" },
                  ].find((o) => o.value === formData.status) || null
                }
                onChange={(opt: any) =>
                  handleChange({
                    target: {
                      name: "status",
                      value: opt ? opt.value : "ACTIVE",
                    },
                  } as any)
                }
                options={[
                  { value: "ACTIVE", label: "Active (Visible)" },
                  { value: "DRAFT", label: "Draft (Hidden)" },
                ]}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gold-800 dark:text-white mb-4">
              SubCategory Image
            </h3>
            <div className="space-y-4">
              {(imagePreview || formData.image) ? (
                <div className="relative w-full h-40 rounded-md overflow-hidden border border-gold-200 dark:border-gold-700 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview || formData.image}
                    alt="SubCategory preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview("");
                        setFormData((prev) => ({ ...prev, image: "" }));
                      }}
                      className="text-white text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gold-300 border-dashed rounded-lg cursor-pointer bg-white dark:hover:bg-bray-800 hover:bg-white dark:border-gold-600 dark:hover:border-gold-500 dark:hover:bg-gold-700 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-8 h-8 mb-2 text-gold-400" />
                      <p className="mb-2 text-sm text-gold-500 dark:text-gold-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}

              <div className="pt-2 border-t border-gold-100 dark:border-gold-800">
                <label className="block text-xs font-medium text-gold-500 dark:text-gold-400 mb-1">
                  Or enter image URL manually
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={(e) => {
                    handleChange(e);
                    if (e.target.value) {
                      setSelectedFile(null);
                      setImagePreview("");
                    }
                  }}
                  disabled={!!selectedFile}
                  className="w-full px-3 py-2 text-sm border border-gold-200 dark:border-gold-700 rounded-md bg-white text-gold-800 dark:text-gold-200 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-colors disabled:opacity-50"
                  placeholder="https://res.cloudinary.com/..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
