"use client";
import {useLanguage} from "../../../core/i18n";
import { useDraftGuard,useUnsaved } from "../../admin-workspace/useUnsaved";

import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useState,
} from "react";

import type {
  HotelFormValues,
  HotelMedia,
} from "../types";

type Props = {
  initialValues?: Partial<HotelFormValues>;

  existingCoverUrl?: string;

  existingGallery?: HotelMedia[];

  isSubmitting?: boolean;

  submitLabel?: string;

  onSubmit: (
    values: HotelFormValues,
    options?: {
      removedGalleryIds?: string[];
    },
  ) => Promise<void> | void;
};

const defaultValues: HotelFormValues = {
  nameAr: "",
  nameEn: "",

  cityAr: "",
  cityEn: "",

  stars: 5,

  descriptionAr: "",
  descriptionEn: "",

  addressAr: "",
  addressEn: "",

  latitude: null,
  longitude: null,

  sortOrder: 0,
  isActive: true,

  coverFile: null,
  galleryFiles: [],
};

function normalizeNumber(
  value: string,
): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

export default function HotelForm({
  initialValues,
  existingCoverUrl,
  existingGallery = [],
  isSubmitting = false,
  submitLabel,
  onSubmit,
}: Props) {
  const {language}=useLanguage();const ar=language==='ar';
  const initialFormValues =
    useMemo<HotelFormValues>(
      () => ({
        ...defaultValues,
        ...initialValues,

        coverFile: null,
        galleryFiles: [],
      }),
      [initialValues],
    );

  const [values, setValues] =
    useState<HotelFormValues>(
      initialFormValues,
    );
  const markDraftSaved = useDraftGuard(values, ar ? 'لديك تعديلات غير محفوظة. هل تريد المغادرة؟' : 'You have unsaved changes. Leave?');


  const [coverPreview, setCoverPreview] =
    useState<string | null>(
      existingCoverUrl ?? null,
    );

  const [galleryPreviews, setGalleryPreviews] =
    useState<string[]>([]);

  const [
    removedGalleryIds,
    setRemovedGalleryIds,
  ] = useState<string[]>([]);

  const [error, setError] =
    useState<string | null>(null);
  useUnsaved(removedGalleryIds.length>0,ar?'لديك تغييرات غير محفوظة في المعرض. هل تريد المغادرة؟':'You have unsaved gallery changes. Leave?');

  function setField<
    K extends keyof HotelFormValues,
  >(
    key: K,
    value: HotelFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleCoverChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0] ??
      null;

    setField("coverFile", file);

    if (!file) {
      setCoverPreview(
        existingCoverUrl ?? null,
      );

      return;
    }

    setCoverPreview(
      URL.createObjectURL(file),
    );
  }

  function handleGalleryChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(
      event.target.files ?? [],
    );

    setField(
      "galleryFiles",
      files,
    );

    setGalleryPreviews(
      files.map((file) =>
        URL.createObjectURL(file),
      ),
    );
  }

  function removeExistingGalleryImage(
    hotelMediaId: string,
  ) {
    setRemovedGalleryIds(
      (current) => [
        ...new Set([
          ...current,
          hotelMediaId,
        ]),
      ],
    );
  }

  function restoreExistingGalleryImage(
    hotelMediaId: string,
  ) {
    setRemovedGalleryIds(
      (current) =>
        current.filter(
          (id) =>
            id !== hotelMediaId,
        ),
    );
  }

  function removeNewGalleryImage(
    indexToRemove: number,
  ) {
    setValues((current) => ({
      ...current,

      galleryFiles:
        current.galleryFiles.filter(
          (_, index) =>
            index !==
            indexToRemove,
        ),
    }));

    setGalleryPreviews(
      (current) =>
        current.filter(
          (_, index) =>
            index !==
            indexToRemove,
        ),
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    if (
      !values.nameAr.trim() ||
      !values.nameEn.trim()
    ) {
      setError(
        (ar ? "اسم الفندق بالعربية والإنجليزية مطلوب." : "Hotel name in Arabic and English is required."),
      );

      return;
    }

    if (
      values.stars < 1 ||
      values.stars > 5
    ) {
      setError(
        (ar ? "عدد النجوم يجب أن يكون بين 1 و5." : "Star rating must be between 1 and 5."),
      );

      return;
    }

    if (
      values.latitude !== null &&
      (
        values.latitude < -90 ||
        values.latitude > 90
      )
    ) {
      setError(
        (ar ? "خط العرض يجب أن يكون بين -90 و90." : "Latitude must be between -90 and 90."),
      );

      return;
    }

    if (
      values.longitude !== null &&
      (
        values.longitude < -180 ||
        values.longitude > 180
      )
    ) {
      setError(
        (ar ? "خط الطول يجب أن يكون بين -180 و180." : "Longitude must be between -180 and 180."),
      );

      return;
    }

    if (values.sortOrder < 0) {
      setError(
        (ar ? "ترتيب الظهور لا يمكن أن يكون أقل من صفر." : "Display order cannot be negative."),
      );

      return;
    }

    try {
      await onSubmit(
        values,
        {
          removedGalleryIds,
        },
      );
    markDraftSaved();
    setRemovedGalleryIds([]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : (ar ? "تعذر حفظ الفندق." : "Unable to save hotel."),
      );
    }
  }

  return (
    <form
      className="nour-hotel-form"
      onSubmit={handleSubmit}
    >
      {error ? (
        <div
          className="nour-hotel-form__error"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <section className="nour-hotel-form__section">
        <div className="nour-hotel-form__section-heading">
          <span>01</span>

          <div>
            <h3>{ar ? "المعلومات الأساسية" : "Basic information"}</h3>

            <p>{ar ? "اسم الفندق والمدينة\r\n              والتصنيف." : "Hotel name, city and rating."}</p>
          </div>
        </div>

        <div className="nour-hotel-form__grid">
          <label>
            <span>{ar ? "اسم الفندق بالعربية" : "Hotel name in Arabic"}</span>

            <input
              value={values.nameAr}
              onChange={(event) =>
                setField(
                  "nameAr",
                  event.target.value,
                )
              }
              placeholder={ar ? "مثال: فندق نور مكة" : "Example: Nour Makkah Hotel"}
              required
            />
          </label>

          <label>
            <span>
              Hotel name
            </span>

            <input
              value={values.nameEn}
              onChange={(event) =>
                setField(
                  "nameEn",
                  event.target.value,
                )
              }
              placeholder="Nour Makkah Hotel"
              required
            />
          </label>

          <label>
            <span>{ar ? "المدينة بالعربية" : "City in Arabic"}</span>

            <input
              value={values.cityAr}
              onChange={(event) =>
                setField(
                  "cityAr",
                  event.target.value,
                )
              }
              placeholder={ar ? "مكة المكرمة" : "Makkah"}
            />
          </label>

          <label>
            <span>
              City
            </span>

            <input
              value={values.cityEn}
              onChange={(event) =>
                setField(
                  "cityEn",
                  event.target.value,
                )
              }
              placeholder="Makkah"
            />
          </label>

          <label>
            <span>{ar ? "عدد النجوم" : "Star rating"}</span>

            <select
              value={values.stars}
              onChange={(event) =>
                setField(
                  "stars",
                  Number(
                    event.target.value,
                  ),
                )
              }
            >
              <option value={1}>
                ⭐
              </option>

              <option value={2}>
                ⭐⭐
              </option>

              <option value={3}>
                ⭐⭐⭐
              </option>

              <option value={4}>
                ⭐⭐⭐⭐
              </option>

              <option value={5}>
                ⭐⭐⭐⭐⭐
              </option>
            </select>
          </label>

          <label>
            <span>{ar ? "ترتيب الظهور" : "Display order"}</span>

            <input
              type="number"
              min={0}
              value={values.sortOrder}
              onChange={(event) =>
                setField(
                  "sortOrder",
                  Math.max(
                    0,
                    Number(
                      event.target.value,
                    ) || 0,
                  ),
                )
              }
            />
          </label>
        </div>
      </section>

      <section className="nour-hotel-form__section">
        <div className="nour-hotel-form__section-heading">
          <span>02</span>

          <div>
            <h3>{ar ? "الوصف والعنوان" : "Description and address"}</h3>

            <p>{ar ? "محتوى الفندق الذي سيظهر\r\n              للزائر." : "Hotel content displayed to visitors."}</p>
          </div>
        </div>

        <div className="nour-hotel-form__grid">
          <label className="nour-hotel-form__wide">
            <span>{ar ? "وصف الفندق بالعربية" : "Hotel description in Arabic"}</span>

            <textarea
              rows={5}
              value={
                values.descriptionAr
              }
              onChange={(event) =>
                setField(
                  "descriptionAr",
                  event.target.value,
                )
              }
            />
          </label>

          <label className="nour-hotel-form__wide">
            <span>
              Hotel description
            </span>

            <textarea
              rows={5}
              value={
                values.descriptionEn
              }
              onChange={(event) =>
                setField(
                  "descriptionEn",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            <span>{ar ? "العنوان بالعربية" : "Address in Arabic"}</span>

            <input
              value={values.addressAr}
              onChange={(event) =>
                setField(
                  "addressAr",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            <span>
              Address
            </span>

            <input
              value={values.addressEn}
              onChange={(event) =>
                setField(
                  "addressEn",
                  event.target.value,
                )
              }
            />
          </label>
        </div>
      </section>

      <section className="nour-hotel-form__section">
        <div className="nour-hotel-form__section-heading">
          <span>03</span>

          <div>
            <h3>{ar ? "الموقع الجغرافي" : "Location"}</h3>

            <p>{ar ? "إحداثيات الفندق لاستخدامها\r\n              لاحقًا في الخرائط." : "Hotel coordinates for maps."}</p>
          </div>
        </div>

        <div className="nour-hotel-form__grid">
          <label>
            <span>{ar ? "خط العرض" : "Latitude"}</span>

            <input
              type="number"
              step="0.000001"
              min="-90"
              max="90"
              value={
                values.latitude ?? ""
              }
              onChange={(event) =>
                setField(
                  "latitude",
                  normalizeNumber(
                    event.target.value,
                  ),
                )
              }
              placeholder="21.422500"
            />
          </label>

          <label>
            <span>{ar ? "خط الطول" : "Longitude"}</span>

            <input
              type="number"
              step="0.000001"
              min="-180"
              max="180"
              value={
                values.longitude ?? ""
              }
              onChange={(event) =>
                setField(
                  "longitude",
                  normalizeNumber(
                    event.target.value,
                  ),
                )
              }
              placeholder="39.826200"
            />
          </label>
        </div>
      </section>

      <section className="nour-hotel-form__section">
        <div className="nour-hotel-form__section-heading">
          <span>04</span>

          <div>
            <h3>{ar ? "صورة الغلاف" : "Cover image"}</h3>

            <p>{ar ? "الصورة الأساسية التي ستظهر\r\n              في بطاقة الفندق." : "Main image displayed in the hotel card."}</p>
          </div>
        </div>

        <label className="nour-hotel-form__upload">
          <input
            type="file"
            accept="image/*"
            onChange={
              handleCoverChange
            }
          />

          <strong>{ar ? "اختر صورة الغلاف" : "Choose cover image"}</strong>

          <small>{ar ? "JPG, PNG أو WebP" : "JPG, PNG or WebP"}</small>
        </label>

        {coverPreview ? (
          <div className="nour-hotel-form__cover-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverPreview}
              alt="Hotel cover preview"
            />
          </div>
        ) : null}
      </section>

      <section className="nour-hotel-form__section">
        <div className="nour-hotel-form__section-heading">
          <span>05</span>

          <div>
            <h3>{ar ? "معرض صور الفندق" : "Hotel gallery"}</h3>

            <p>{ar ? "يمكنك إضافة عدة صور للغرف\r\n              والمرافق والفندق." : "Add room, facility and hotel images."}</p>
          </div>
        </div>

        <label className="nour-hotel-form__upload">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={
              handleGalleryChange
            }
          />

          <strong>{ar ? "اختر صور المعرض" : "Choose gallery images"}</strong>

          <small>{ar ? "يمكنك اختيار عدة صور\r\n            دفعة واحدة" : "Select multiple images at once"}</small>
        </label>

        {existingGallery.length >
        0 ? (
          <div className="nour-hotel-form__gallery">
            {existingGallery.map(
              (image) => {
                const isRemoved =
                  removedGalleryIds.includes(
                    image.id,
                  );

                return (
                  <article
                    key={image.id}
                    className={
                      isRemoved
                        ? "is-removed"
                        : ""
                    }
                  >
                    {image.publicUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={
                          image.publicUrl
                        }
                        alt=""
                      />
                    ) : null}

                    {isRemoved ? (
                      <button
                        type="button"
                        onClick={() =>
                          restoreExistingGalleryImage(
                            image.id,
                          )
                        }
                      >{ar ? "استعادة" : "Restore"}</button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          removeExistingGalleryImage(
                            image.id,
                          )
                        }
                      >{ar ? "إزالة" : "Remove"}</button>
                    )}
                  </article>
                );
              },
            )}
          </div>
        ) : null}

        {galleryPreviews.length >
        0 ? (
          <div className="nour-hotel-form__gallery">
            {galleryPreviews.map(
              (preview, index) => (
                <article
                  key={`${preview}-${index}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt=""
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeNewGalleryImage(
                        index,
                      )
                    }
                  >{ar ? "إزالة" : "Remove"}</button>
                </article>
              ),
            )}
          </div>
        ) : null}
      </section>

      <section className="nour-hotel-form__section">
        <div className="nour-hotel-form__section-heading">
          <span>06</span>

          <div>
            <h3>{ar ? "حالة الفندق" : "Hotel status"}</h3>

            <p>{ar ? "التحكم بظهور الفندق\r\n              واستخدامه داخل البرامج." : "Control hotel visibility and its use in programs."}</p>
          </div>
        </div>

        <label className="nour-hotel-form__switch">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(event) =>
              setField(
                "isActive",
                event.target.checked,
              )
            }
          />

          <span>{ar ? "الفندق مفعّل" : "Hotel is active"}</span>
        </label>
      </section>

      <div className="nour-hotel-form__actions">
        <button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "جارٍ الحفظ..."
            : submitLabel}
        </button>
      </div>

      <style jsx>{`
        .nour-hotel-form {
          display: grid;
          gap: 20px;
        }

        .nour-hotel-form__error {
          padding: 14px 16px;
          border: 1px solid
            rgba(220, 38, 38, 0.18);
          border-radius: 14px;
          color: #b91c1c;
          background:
            rgba(254, 226, 226, 0.7);
          font-size: 13px;
          font-weight: 800;
        }

        .nour-hotel-form__section {
          padding: 22px;
          border: 1px solid
            var(--nour-border);
          border-radius: 20px;
          background:
            var(--nour-surface);
        }

        .nour-hotel-form__section-heading {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
        }

        .nour-hotel-form__section-heading
          > span {
          display: grid;
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          place-items: center;
          border-radius: 10px;
          color: #fff;
          background:
            var(--nour-primary);
          font-size: 11px;
          font-weight: 900;
        }

        .nour-hotel-form__section-heading h3 {
          margin: 0;
          color:
            var(--nour-text-primary);
          font-size: 16px;
        }

        .nour-hotel-form__section-heading p {
          margin: 5px 0 0;
          color: #768399;
          font-size: 12px;
        }

        .nour-hotel-form__grid {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 16px;
        }

        .nour-hotel-form label {
          display: grid;
          gap: 7px;
        }

        .nour-hotel-form label
          > span {
          color:
            var(--nour-text-primary);
          font-size: 12px;
          font-weight: 800;
        }

        .nour-hotel-form input,
        .nour-hotel-form select,
        .nour-hotel-form textarea {
          width: 100%;
          border: 1px solid
            var(--nour-border);
          border-radius: 12px;
          padding: 11px 12px;
          color:
            var(--nour-text-primary);
          background:
            var(--nour-background);
          font: inherit;
          outline: none;
        }

        .nour-hotel-form textarea {
          resize: vertical;
        }

        .nour-hotel-form input:focus,
        .nour-hotel-form select:focus,
        .nour-hotel-form textarea:focus {
          border-color:
            var(--nour-primary);
          box-shadow:
            0 0 0 3px
            rgba(
              23,
              111,
              232,
              0.1
            );
        }

        .nour-hotel-form__wide {
          grid-column: 1 / -1;
        }

        .nour-hotel-form__upload {
          min-height: 120px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 6px;
          border: 1px dashed
            rgba(
              23,
              111,
              232,
              0.35
            );
          border-radius: 16px;
          color:
            var(--nour-primary);
          background:
            rgba(
              23,
              111,
              232,
              0.04
            );
          cursor: pointer;
          text-align: center;
        }

        .nour-hotel-form__upload
          input {
          display: none;
        }

        .nour-hotel-form__upload
          small {
          color: #7d8999;
        }

        .nour-hotel-form__cover-preview {
          position: relative;
          overflow: hidden;
          margin-top: 14px;
          height: 260px;
          border-radius: 16px;
          background: #e9eef5;
        }

        .nour-hotel-form__cover-preview
          img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .nour-hotel-form__gallery {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );
          gap: 10px;
          margin-top: 14px;
        }

        .nour-hotel-form__gallery
          article {
          position: relative;
          height: 130px;
          overflow: hidden;
          border-radius: 13px;
          background: #e8edf4;
        }

        .nour-hotel-form__gallery
          article.is-removed {
          opacity: 0.35;
        }

        .nour-hotel-form__gallery
          img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .nour-hotel-form__gallery
          button {
          position: absolute;
          inset-inline-end: 7px;
          bottom: 7px;
          min-height: 29px;
          padding-inline: 9px;
          border: 0;
          border-radius: 8px;
          color: #fff;
          background:
            rgba(
              5,
              22,
              43,
              0.78
            );
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .nour-hotel-form__switch {
          display: inline-flex !important;
          width: fit-content;
          grid-template-columns:
            auto 1fr;
          align-items: center;
          gap: 9px !important;
        }

        .nour-hotel-form__switch
          input {
          width: 18px;
          height: 18px;
        }

        .nour-hotel-form__actions {
          display: flex;
          justify-content: flex-end;
        }

        .nour-hotel-form__actions
          button {
          min-width: 150px;
          min-height: 45px;
          padding-inline: 20px;
          border: 0;
          border-radius: 12px;
          color: #fff;
          background:
            var(--nour-primary);
          font: inherit;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        .nour-hotel-form__actions
          button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (
          max-width: 760px
        ) {
          .nour-hotel-form__grid {
            grid-template-columns:
              1fr;
          }

          .nour-hotel-form__wide {
            grid-column: auto;
          }

          .nour-hotel-form__gallery {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }
        }
      `}</style>
    </form>
  );
}
