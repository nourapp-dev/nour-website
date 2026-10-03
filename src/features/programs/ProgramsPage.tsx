"use client";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";

import Button from "../../components/ui/Button";
import { useLanguage } from "../../core/i18n";
import { useToast } from "../../core/notifications";
import { createClient } from "../../lib/supabase/client";
import { countriesQuery } from "../countries/services";
import { listHotels } from "../hotels/services";
import {
  getTransportsForProgram,
  listTransports,
  saveProgramTransports,
} from "../transports/services";
import type {
  ProgramTransportFormValue,
} from "../transports/types/transport";
import {
  getVisasForProgram,
  listVisas,
  saveProgramVisas,
} from "../visas/services";
import type {
  ProgramVisaFormValue,
} from "../visas/types/visa";

import ProgramForm from "./forms/ProgramForm";
import { departurePayloads, type DepartureDraft } from "./departure-drafts";
import { createProgramDepartures } from "./services/program-departures.service";
import {
  createProgram,
  deleteProgram,
  getDeletedPrograms,
  getFlightsForProgram,
  getHotelsForProgram,
  getPrograms,
  permanentlyDeleteProgram,
  restoreProgram,
  updateProgram,
} from "./services";
import type {
  Program,
  ProgramFlightFormValue,
  ProgramFormValues,
  ProgramHotelFormValue,
} from "./types";

type ProgramFormSubmitValues =
  ProgramFormValues & {
    transports: ProgramTransportFormValue[];
    visas: ProgramVisaFormValue[];
    departures: DepartureDraft[];
  };

type ProgramCountryOption = {
  id: string;
  nameAr: string;
  nameEn: string;
};

type ProgramHotelOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  cityAr?: string;
  cityEn?: string;
  stars?: number;
  status: string;
};

type ProgramTransportOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  providerNameAr?: string | null;
  providerNameEn?: string | null;
  serviceType: import("../transports/types/transport").TransportServiceType;
  mode: import("../transports/types/transport").TransportMode;
  vehicleType: import("../transports/types/transport").TransportVehicleType;
  vehicleNameAr?: string | null;
  vehicleNameEn?: string | null;
  capacity: number;
  isActive: boolean;
};

type ProgramVisaOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  visaType: import("../visas/types/visa").VisaType;
  processingType: import("../visas/types/visa").VisaProcessingType;
  processingTimeDays: number | null;
  validityDays: number | null;
  maxStayDays: number | null;
  basePrice: number | null;
  currencyCode: string | null;
  isActive: boolean;
};

type ProgramStatusFilter =
  | "all"
  | "published"
  | "draft"
  | "inactive";

type ProgramSortOption =
  | "display"
  | "newest"
  | "priceAsc"
  | "priceDesc";

const PROGRAMS_PER_PAGE = 6;

export default function ProgramsPage() {
  const { language } = useLanguage();
  const { showToast } = useToast();

  const isArabic = language === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProgramId = searchParams.get("edit");

  const supabase = useMemo(() => {
    return createClient();
  }, []);

  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [isTrashOpen, setIsTrashOpen] =
    useState(false);

  const [
    restoringProgramId,
    setRestoringProgramId,
  ] = useState<string | null>(null);

  const [
    permanentlyDeletingProgramId,
    setPermanentlyDeletingProgramId,
  ] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [
    deletingProgramId,
    setDeletingProgramId,
  ] = useState<string | null>(null);

  const [editingProgram, setEditingProgram] =
    useState<Program | null>(null);

  const [
    editingProgramHotels,
    setEditingProgramHotels,
  ] = useState<ProgramHotelFormValue[]>([]);

  const [
    editingProgramFlights,
    setEditingProgramFlights,
  ] = useState<ProgramFlightFormValue[]>([]);

  const [
    editingProgramTransports,
    setEditingProgramTransports,
  ] = useState<ProgramTransportFormValue[]>([]);

  const [
    editingProgramVisas,
    setEditingProgramVisas,
  ] = useState<ProgramVisaFormValue[]>([]);

  const [
    isEditingHotelsLoading,
    setIsEditingHotelsLoading,
  ] = useState(false);

  const [
    isEditingFlightsLoading,
    setIsEditingFlightsLoading,
  ] = useState(false);

  const [
    isEditingTransportsLoading,
    setIsEditingTransportsLoading,
  ] = useState(false);

  const [
    isEditingVisasLoading,
    setIsEditingVisasLoading,
  ] = useState(false);

  const [formError, setFormError] =
    useState("");

  const [searchValue, setSearchValue] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<ProgramStatusFilter>("all");

  const [countryFilter, setCountryFilter] =
    useState("all");

  const [sortBy, setSortBy] =
    useState<ProgramSortOption>("display");

  const [currentPage, setCurrentPage] =
    useState(1);

  const {
    data: currentUser,
    isLoading: isCurrentUserLoading,
    isError: isCurrentUserError,
  } = useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      return user;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const {
    data: permissions,
    isLoading: isPermissionsLoading,
    isError: isPermissionsError,
  } = useQuery({
    queryKey: [
      "programs",
      "permissions",
      currentUser?.id ?? "anonymous",
    ],
    enabled: Boolean(currentUser?.id),
    queryFn: async () => {
      const permissionKeys = [
        "programs.create",
        "programs.update",
        "programs.publish",
        "programs.delete",
      ] as const;

      const results = await Promise.all(
        permissionKeys.map(async (permissionKey) => {
          const { data, error } = await supabase.rpc(
            "current_user_has_permission",
            {
              permission_code: permissionKey,
            },
          );

          if (error) {
            throw error;
          }

          return [permissionKey, Boolean(data)] as const;
        }),
      );

      return Object.fromEntries(results) as Record<
        (typeof permissionKeys)[number],
        boolean
      >;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const canCreate =
    permissions?.["programs.create"] ?? false;
  const canUpdate =
    permissions?.["programs.update"] ?? false;
  const canPublish =
    permissions?.["programs.publish"] ?? false;
  const canDelete =
    permissions?.["programs.delete"] ?? false;

  const {
    data: countriesData = [],
    isLoading: isCountriesLoading,
    isError: isCountriesError,
    error: countriesError,
  } = useQuery(countriesQuery(supabase));

  const countries =
    countriesData as ProgramCountryOption[];

  const {
    data: hotelsData = [],
    isLoading: isHotelsLoading,
    isError: isHotelsError,
    error: hotelsError,
  } = useQuery({
    queryKey: [
      "hotels",
      "program-options",
      currentUser?.id ?? "anonymous",
    ],
    queryFn: () => listHotels(supabase),
    enabled: Boolean(currentUser?.id),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const hotels =
    hotelsData as ProgramHotelOption[];

  const activeHotels = hotels.filter(
    (hotel: ProgramHotelOption) =>
      hotel.status === "active",
  );

  const {
    data: transportsData = [],
    isLoading: isTransportsLoading,
    isError: isTransportsError,
    error: transportsError,
  } = useQuery({
    queryKey: [
      "transports",
      "program-options",
      currentUser?.id ?? "anonymous",
    ],
    queryFn: () => listTransports(supabase),
    enabled: Boolean(currentUser?.id),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const transports =
    transportsData as ProgramTransportOption[];

  const activeTransports = transports.filter(
    (transport: ProgramTransportOption) =>
      transport.isActive,
  );

  const {
    data: visasData = [],
    isLoading: isVisasLoading,
    isError: isVisasError,
    error: visasError,
  } = useQuery({
    queryKey: [
      "visas",
      "program-options",
      currentUser?.id ?? "anonymous",
    ],
    queryFn: () => listVisas(supabase),
    enabled: Boolean(currentUser?.id),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const visas =
    visasData as ProgramVisaOption[];

  const activeVisas = visas.filter(
    (visa: ProgramVisaOption) =>
      visa.isActive,
  );

  const {
    data: programs = [],
    isLoading: isProgramsLoading,
    isError: isProgramsError,
    isSuccess: isProgramsSuccess,
    error: programsError,
    refetch: refetchPrograms,
  } = useQuery({
    queryKey: [
      "programs",
      "list",
      currentUser?.id ?? "anonymous",
    ],
    queryFn: () => getPrograms(supabase),
    enabled: Boolean(currentUser?.id),
  });

  const {
    data: deletedPrograms = [],
    isLoading: isDeletedProgramsLoading,
    isError: isDeletedProgramsError,
    error: deletedProgramsError,
    refetch: refetchDeletedPrograms,
  } = useQuery({
    queryKey: [
      "programs",
      "deleted",
      currentUser?.id ?? "anonymous",
    ],
    queryFn: () =>
      getDeletedPrograms(supabase),
    enabled:
      Boolean(currentUser?.id) &&
      isTrashOpen &&
      canDelete,
  });

  const filteredPrograms = programs.filter(
    (program) => {
      const search = searchValue
        .trim()
        .toLowerCase();

      const matchesSearch =
        !search ||
        program.titleAr
          .toLowerCase()
          .includes(search) ||
        program.titleEn
          .toLowerCase()
          .includes(search) ||
        program.slug
          .toLowerCase()
          .includes(search) ||
        program.summaryAr
          .toLowerCase()
          .includes(search) ||
        program.summaryEn
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        program.status === statusFilter;

      const matchesCountry =
        countryFilter === "all" ||
        program.countryId === countryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCountry
      );
    },
  );

  const sortedPrograms: Program[] = [
    ...filteredPrograms,
  ].sort((firstProgram, secondProgram) => {
    if (sortBy === "newest") {
      return (
        new Date(
          secondProgram.createdAt,
        ).getTime() -
        new Date(
          firstProgram.createdAt,
        ).getTime()
      );
    }

    if (sortBy === "priceAsc") {
      return (
        firstProgram.basePrice -
        secondProgram.basePrice
      );
    }

    if (sortBy === "priceDesc") {
      return (
        secondProgram.basePrice -
        firstProgram.basePrice
      );
    }

    return (
      firstProgram.sortOrder -
      secondProgram.sortOrder
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(
      sortedPrograms.length /
        PROGRAMS_PER_PAGE,
    ),
  );

  const paginatedPrograms: Program[] =
    sortedPrograms.slice(
      (currentPage - 1) *
        PROGRAMS_PER_PAGE,
      currentPage * PROGRAMS_PER_PAGE,
    );

  const filterKey = JSON.stringify([searchValue, statusFilter, countryFilter, sortBy]);
  const [previousFilterKey, setPreviousFilterKey] = useState(filterKey);
  if (filterKey !== previousFilterKey || currentPage > totalPages) {
    setPreviousFilterKey(filterKey);
    setCurrentPage(filterKey !== previousFilterKey ? 1 : totalPages);
  }

  useEffect(() => {
    if (
      !isProgramsSuccess ||
      !editProgramId ||
      !canUpdate
    ) {
      return;
    }

    const programToEdit = programs.find(
      (program) =>
        program.id === editProgramId,
    );

    if (!programToEdit) {
      return;
    }

    void openEditDialog(programToEdit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editProgramId,
    isProgramsSuccess,
    programs,
    canUpdate,
  ]);

  function openCreateDialog() {
    if (!canCreate) {
      return;
    }

    setFormError("");
    setEditingProgram(null);
    setEditingProgramHotels([]);
    setEditingProgramFlights([]);
    setEditingProgramTransports([]);
    setEditingProgramVisas([]);
    setIsCreateOpen(true);
  }

  function closeCreateDialog() {
    if (isSubmitting) {
      return;
    }

    setFormError("");
    setEditingProgram(null);
    setEditingProgramHotels([]);
    setEditingProgramFlights([]);
    setEditingProgramTransports([]);
    setEditingProgramVisas([]);
    setIsCreateOpen(false);

    if (editProgramId) {
      router.replace("/admin/programs");
    }
  }

  async function openEditDialog(
    program: Program,
  ) {
    if (!canUpdate) {
      return;
    }

    setFormError("");
    setIsEditingHotelsLoading(true);
    setIsEditingFlightsLoading(true);
    setIsEditingTransportsLoading(true);
    setIsEditingVisasLoading(true);

    try {
      const [
        linkedHotels,
        linkedFlights,
        linkedTransports,
        linkedVisas,
      ] = await Promise.all([
        getHotelsForProgram(
          supabase,
          program.id,
        ),
        getFlightsForProgram(
          supabase,
          program.id,
        ),
        getTransportsForProgram(
          supabase,
          program.id,
        ),
        getVisasForProgram(
          supabase,
          program.id,
        ),
      ]);

      setEditingProgramHotels(
        linkedHotels.map((hotel) => ({
          hotelId: hotel.hotelId,
          nights: hotel.nights,
          roomTypeAr: hotel.roomTypeAr,
          roomTypeEn: hotel.roomTypeEn,
          mealPlanAr: hotel.mealPlanAr,
          mealPlanEn: hotel.mealPlanEn,
          checkInDate:
            hotel.checkInDate ?? "",
          checkOutDate:
            hotel.checkOutDate ?? "",
          notesAr: hotel.notesAr,
          notesEn: hotel.notesEn,
          sortOrder: hotel.sortOrder,
        })),
      );

      setEditingProgramFlights(
        linkedFlights.map((flight) => ({
          direction: flight.direction,
          airlineNameAr:
            flight.airlineNameAr,
          airlineNameEn:
            flight.airlineNameEn,
          flightNumber:
            flight.flightNumber,
          departureAirportAr:
            flight.departureAirportAr,
          departureAirportEn:
            flight.departureAirportEn,
          arrivalAirportAr:
            flight.arrivalAirportAr,
          arrivalAirportEn:
            flight.arrivalAirportEn,
          departureAt:
            flight.departureAt
              ? flight.departureAt.slice(
                  0,
                  16,
                )
              : "",
          arrivalAt:
            flight.arrivalAt
              ? flight.arrivalAt.slice(
                  0,
                  16,
                )
              : "",
          flightType:
            flight.flightType,
          transitAirportAr:
            flight.transitAirportAr,
          transitAirportEn:
            flight.transitAirportEn,
          transitDurationMinutes:
            flight.transitDurationMinutes,
          cabinClassAr:
            flight.cabinClassAr,
          cabinClassEn:
            flight.cabinClassEn,
          baggageAllowanceKg:
            flight.baggageAllowanceKg,
          notesAr: flight.notesAr,
          notesEn: flight.notesEn,
          sortOrder: flight.sortOrder,
        })),
      );

      setEditingProgramTransports(
        linkedTransports.map((transport) => ({
          id: transport.id,
          transportId: transport.transportId,
          dayNumber: transport.dayNumber,
          pickupNameAr: transport.pickupNameAr ?? "",
          pickupNameEn: transport.pickupNameEn ?? "",
          dropoffNameAr: transport.dropoffNameAr ?? "",
          dropoffNameEn: transport.dropoffNameEn ?? "",
          pickupDatetime: transport.pickupDatetime
            ? transport.pickupDatetime.slice(0, 16)
            : "",
          estimatedDurationMinutes:
            transport.estimatedDurationMinutes,
          notesAr: transport.notesAr ?? "",
          notesEn: transport.notesEn ?? "",
          isIncluded: transport.isIncluded,
          sortOrder: transport.sortOrder,
        })),
      );

      setEditingProgramVisas(
        linkedVisas.map((visa) => ({
          id: visa.id,
          visaId: visa.visaId,
          isIncluded: visa.isIncluded,
          notesAr: visa.notesAr ?? "",
          notesEn: visa.notesEn ?? "",
          sortOrder: visa.sortOrder,
        })),
      );

      setEditingProgram(program);
      setIsCreateOpen(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isArabic
            ? "تعذر تحميل بيانات الفنادق أو الرحلات أو النقل أو التأشيرات للبرنامج."
            : "Unable to load program hotel, flight, transport, or visa data.";

      setFormError(message);

      showToast({
        title: isArabic
          ? "تعذر فتح البرنامج للتعديل"
          : "Unable to open program for editing",
        description: message,
        variant: "error",
      });
    } finally {
      setIsEditingHotelsLoading(false);
      setIsEditingFlightsLoading(false);
      setIsEditingTransportsLoading(false);
      setIsEditingVisasLoading(false);
    }
  }

  async function handleCreateProgram(
    values: ProgramFormSubmitValues,
  ) {
    const hasRequiredPermission =
      editingProgram ? canUpdate : canCreate;

    if (!hasRequiredPermission) {
      showToast({
        title: isArabic
          ? "ليس لديك صلاحية تنفيذ هذه العملية"
          : "You do not have permission to perform this action",
        variant: "error",
      });
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    const wasEditing =
      editingProgram !== null;
    let persistedProgram: Program | null = null;

    try {
      const {
        transports: programTransports,
        visas: programVisas,
        departures,
        ...programValues
      } = values;

      let savedProgramId: string;

      if (editingProgram) {
        const updatedProgram =
          await updateProgram(
            supabase,
            editingProgram.id,
            programValues,
            editingProgram.coverMediaId,
          );

        savedProgramId =
          updatedProgram?.id ??
          editingProgram.id;
      } else {
        const createdProgram =
          await createProgram(
            supabase,
            programValues,
            (program) => { persistedProgram = program; },
          );

        savedProgramId =
          createdProgram.id;
      }

      await Promise.all([
        saveProgramTransports(
          supabase,
          savedProgramId,
          programTransports,
        ),
        saveProgramVisas(
          supabase,
          savedProgramId,
          programVisas,
        ),
      ]);

      if (!wasEditing && departures.length) {
        await createProgramDepartures(supabase, savedProgramId, departurePayloads(departures));
      }

      await refetchPrograms();

      setEditingProgram(null);
      setEditingProgramHotels([]);
      setEditingProgramFlights([]);
      setEditingProgramTransports([]);
      setEditingProgramVisas([]);
      setIsCreateOpen(false);

      if (editProgramId) {
        router.replace("/admin/programs");
      }

      showToast({
        title: wasEditing
          ? isArabic
            ? "تم تحديث البرنامج بنجاح"
            : "Program updated successfully"
          : isArabic
            ? "تمت إضافة البرنامج بنجاح"
            : "Program added successfully",
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isArabic
            ? "تعذر حفظ البرنامج."
            : "Unable to save the program.";

      // Once the parent exists, never leave the create form available to submit again.
      if (persistedProgram) {
        const saved = persistedProgram as Program;
        setIsCreateOpen(false);
        void refetchPrograms();
        showToast({
          title: isArabic ? "حُفظ البرنامج ولم تكتمل بعض التفاصيل" : "Program saved; some details could not be saved",
          description: (isArabic ? "راجع البرنامج ومواعيده قبل النشر. " : "Review the program and departures before publishing. ") + message,
          variant: "error",
        });
        router.push(`/admin/programs/${saved.id}/departures`);
        return;
      }
      setFormError(message);

      showToast({
        title: wasEditing
          ? isArabic
            ? "تعذر تحديث البرنامج"
            : "Unable to update program"
          : isArabic
            ? "تعذر إضافة البرنامج"
            : "Unable to add program",
        description: message,
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteProgram(
    programId: string,
  ) {
    if (!canDelete) {
      return;
    }

    const confirmed = window.confirm(
      isArabic
        ? "هل أنت متأكد من حذف هذا البرنامج؟"
        : "Are you sure you want to delete this program?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingProgramId(programId);

    try {
      await deleteProgram(
        supabase,
        programId,
      );

      await refetchPrograms();

      showToast({
        title: isArabic
          ? "تم حذف البرنامج بنجاح"
          : "Program deleted successfully",
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isArabic
            ? "تعذر حذف البرنامج."
            : "Unable to delete the program.";

      console.error(
        "DELETE PROGRAM ERROR:",
        error,
      );

      showToast({
        title: isArabic
          ? "تعذر حذف البرنامج"
          : "Unable to delete program",
        description: message,
        variant: "error",
      });
    } finally {
      setDeletingProgramId(null);
    }
  }

  async function handleRestoreProgram(
    programId: string,
  ) {
    if (!canDelete) {
      return;
    }

    setRestoringProgramId(programId);

    try {
      await restoreProgram(
        supabase,
        programId,
      );

      await Promise.all([
        refetchPrograms(),
        refetchDeletedPrograms(),
      ]);

      showToast({
        title: isArabic
          ? "تمت استعادة البرنامج بنجاح"
          : "Program restored successfully",
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isArabic
            ? "تعذر استعادة البرنامج."
            : "Unable to restore the program.";

      showToast({
        title: isArabic
          ? "تعذر استعادة البرنامج"
          : "Unable to restore program",
        description: message,
        variant: "error",
      });
    } finally {
      setRestoringProgramId(null);
    }
  }

  async function handlePermanentDeleteProgram(
    programId: string,
  ) {
    if (!canDelete) {
      return;
    }

    const confirmed = window.confirm(
      isArabic
        ? "تحذير: سيتم حذف البرنامج نهائيًا ولا يمكن استعادته. هل تريد المتابعة؟"
        : "Warning: This program will be permanently deleted and cannot be restored. Continue?",
    );

    if (!confirmed) {
      return;
    }

    setPermanentlyDeletingProgramId(
      programId,
    );

    try {
      await permanentlyDeleteProgram(
        supabase,
        programId,
      );

      await refetchDeletedPrograms();

      showToast({
        title: isArabic
          ? "تم حذف البرنامج نهائيًا"
          : "Program permanently deleted",
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isArabic
            ? "تعذر حذف البرنامج نهائيًا."
            : "Unable to permanently delete the program.";

      showToast({
        title: isArabic
          ? "تعذر الحذف النهائي"
          : "Unable to permanently delete",
        description: message,
        variant: "error",
      });
    } finally {
      setPermanentlyDeletingProgramId(
        null,
      );
    }
  }

  function resetFilters() {
    setSearchValue("");
    setStatusFilter("all");
    setCountryFilter("all");
    setSortBy("display");
    setCurrentPage(1);
  }

  return (
    <section className="nr-dashboard">
      <div className="nr-dashboard-heading">
        <div>
          <span className="nr-dashboard-kicker">
            {isArabic
              ? "إدارة المحتوى"
              : "Content Management"}
          </span>

          <h1>
            {isArabic
              ? "البرامج"
              : "Programs"}
          </h1>

          <p>
            {isArabic
              ? "إدارة برامج العمرة والخدمات المرتبطة بها."
              : "Manage Umrah programs and their related services."}
          </p>
        </div>

        {canDelete || canCreate ? (
          <div className="nr-programs-heading-actions">
            {canDelete ? (
              <Button
                type="button"
                onClick={() => {
                  setIsTrashOpen(true);
                }}
              >
                {isArabic
                  ? `سلة المحذوفات (${deletedPrograms.length})`
                  : `Recycle Bin (${deletedPrograms.length})`}
              </Button>
            ) : null}

            {canCreate ? (
              <Button
                type="button"
                onClick={openCreateDialog}
              >
                {isArabic
                  ? "إضافة برنامج"
                  : "Add Program"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="nr-programs-toolbar">
        <input
          type="search"
          className="nr-input nr-programs-search"
          value={searchValue}
          onChange={(event) => {
            setSearchValue(
              event.target.value,
            );
          }}
          placeholder={
            isArabic
              ? "ابحث باسم البرنامج أو الرابط..."
              : "Search by program name or slug..."
          }
        />

        <div className="nr-programs-results-count">
          {isArabic
            ? `${sortedPrograms.length} برنامج`
            : `${sortedPrograms.length} programs`}
        </div>

        <select
          className="nr-input nr-programs-filter"
          value={countryFilter}
          onChange={(event) => {
            setCountryFilter(
              event.target.value,
            );
          }}
        >
          <option value="all">
            {isArabic
              ? "جميع الدول"
              : "All countries"}
          </option>

          {countries.map((country: ProgramCountryOption) => (
            <option
              key={country.id}
              value={country.id}
            >
              {isArabic
                ? country.nameAr
                : country.nameEn}
            </option>
          ))}
        </select>

        <select
          className="nr-input nr-programs-filter"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(
              event.target
                .value as ProgramStatusFilter,
            );
          }}
        >
          <option value="all">
            {isArabic
              ? "جميع الحالات"
              : "All statuses"}
          </option>

          <option value="published">
            {isArabic
              ? "منشور"
              : "Published"}
          </option>

          <option value="draft">
            {isArabic
              ? "مسودة"
              : "Draft"}
          </option>

          <option value="inactive">
            {isArabic
              ? "غير نشط"
              : "Inactive"}
          </option>
        </select>

        <select
          className="nr-input nr-programs-filter"
          value={sortBy}
          onChange={(event) => {
            setSortBy(
              event.target
                .value as ProgramSortOption,
            );
          }}
        >
          <option value="display">
            {isArabic
              ? "ترتيب الظهور"
              : "Display order"}
          </option>

          <option value="newest">
            {isArabic
              ? "الأحدث أولًا"
              : "Newest first"}
          </option>

          <option value="priceAsc">
            {isArabic
              ? "السعر: من الأقل"
              : "Price: low to high"}
          </option>

          <option value="priceDesc">
            {isArabic
              ? "السعر: من الأعلى"
              : "Price: high to low"}
          </option>
        </select>

        <button
          type="button"
          className="nr-program-action"
          onClick={resetFilters}
          disabled={
            !searchValue &&
            statusFilter === "all" &&
            countryFilter === "all" &&
            sortBy === "display"
          }
        >
          {isArabic
            ? "إعادة تعيين الفلاتر"
            : "Reset Filters"}
        </button>
      </div>

      {isCurrentUserLoading ||
      isPermissionsLoading ||
      isProgramsLoading ? (
        <div className="nr-state">
          <strong>
            {isArabic
              ? "جاري تحميل البرامج..."
              : "Loading programs..."}
          </strong>
        </div>
      ) : isCurrentUserError ||
      isPermissionsError ? (
        <div className="nr-state">
          <strong>
            {isArabic
              ? "تعذر تحميل صلاحيات البرامج"
              : "Unable to load program permissions"}
          </strong>

          <p>
            {isArabic
              ? "تعذر التحقق من صلاحيات حسابك. أعد تحميل الصفحة."
              : "Your account permissions could not be verified. Reload the page."}
          </p>
        </div>
      ) : isProgramsError ? (
        <div className="nr-state">
          <strong>
            {isArabic
              ? "تعذر تحميل البرامج"
              : "Unable to load programs"}
          </strong>

          <p>
            {programsError instanceof Error
              ? programsError.message
              : isArabic
                ? "حدث خطأ غير متوقع."
                : "An unexpected error occurred."}
          </p>
        </div>
      ) : sortedPrograms.length === 0 ? (
        <div className="nr-state">
          <strong>
            {isArabic
              ? "لا توجد برامج مطابقة"
              : "No matching programs"}
          </strong>

          <p>
            {isArabic
              ? "جرّب تغيير البحث أو الفلاتر."
              : "Try changing the search or filters."}
          </p>
        </div>
      ) : (
        <>
          <div className="nr-programs-grid">
            {paginatedPrograms.map(
              (program: Program) => (
                <article
                  key={program.id}
                  className="nr-program-card"
                >
                  {program.coverUrl ? (
                    <div className="nr-program-card-cover">
                      <img
                        src={program.coverUrl}
                        alt={
                          isArabic
                            ? program.titleAr
                            : program.titleEn
                        }
                      />
                    </div>
                  ) : null}

                  <div className="nr-program-card-header">
                    <div>
                      <span className="nr-dashboard-kicker">
                        {program.status ===
                        "published"
                          ? isArabic
                            ? "منشور"
                            : "Published"
                          : program.status ===
                              "draft"
                            ? isArabic
                              ? "مسودة"
                              : "Draft"
                            : isArabic
                              ? "غير نشط"
                              : "Inactive"}
                      </span>

                      <h2>
                        {isArabic
                          ? program.titleAr
                          : program.titleEn}
                      </h2>
                    </div>

                    <div className="nr-program-card-actions">
                      {program.isFeatured ? (
                        <span className="nr-program-featured">
                          {isArabic
                            ? "مميز"
                            : "Featured"}
                        </span>
                      ) : null}

                      <Link
                        href={`/admin/programs/${program.id}`}
                        className="nr-program-action"
                      >
                        {isArabic
                          ? "عرض التفاصيل"
                          : "View Details"}
                      </Link>

                      {canUpdate ? (
                        <button
                          type="button"
                          className="nr-program-action nr-program-action-edit"
                          onClick={() => {
                            void openEditDialog(
                              program,
                            );
                          }}
                        >
                          {isArabic
                            ? "تعديل"
                            : "Edit"}
                        </button>
                      ) : null}

                      {canDelete ? (
                        <button
                          type="button"
                          className="nr-program-action nr-program-action-delete"
                          onClick={() => {
                            void handleDeleteProgram(
                              program.id,
                            );
                          }}
                          disabled={
                            deletingProgramId ===
                            program.id
                          }
                        >
                          {deletingProgramId ===
                          program.id
                            ? isArabic
                              ? "جاري الحذف..."
                              : "Deleting..."
                            : isArabic
                              ? "حذف"
                              : "Delete"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <p>
                    {isArabic
                      ? program.summaryAr
                      : program.summaryEn}
                  </p>

                  <div className="nr-program-card-meta">
                    <span>
                      {program.durationDays}{" "}
                      {isArabic
                        ? "أيام"
                        : "days"}
                    </span>

                    <span>
                      {program.durationNights}{" "}
                      {isArabic
                        ? "ليالٍ"
                        : "nights"}
                    </span>

                    <strong>
                      {program.basePrice}{" "}
                      {program.currencyCode}
                    </strong>
                  </div>
                </article>
              ),
            )}
          </div>

          {totalPages > 1 ? (
            <div className="nr-programs-pagination">
              <button
                type="button"
                className="nr-program-action"
                onClick={() => {
                  setCurrentPage((page) =>
                    Math.max(1, page - 1),
                  );
                }}
                disabled={currentPage === 1}
              >
                {isArabic
                  ? "السابق"
                  : "Previous"}
              </button>

              <span>
                {isArabic
                  ? `صفحة ${currentPage} من ${totalPages}`
                  : `Page ${currentPage} of ${totalPages}`}
              </span>

              <button
                type="button"
                className="nr-program-action"
                onClick={() => {
                  setCurrentPage((page) =>
                    Math.min(
                      totalPages,
                      page + 1,
                    ),
                  );
                }}
                disabled={
                  currentPage === totalPages
                }
              >
                {isArabic
                  ? "التالي"
                  : "Next"}
              </button>
            </div>
          ) : null}
        </>
      )}

      {isTrashOpen && canDelete ? (
        <div
          className="nr-modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            setIsTrashOpen(false);
          }}
        >
          <section
            className="nr-modal nr-program-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="program-trash-title"
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="nr-modal-header">
              <div>
                <span className="nr-dashboard-kicker">
                  {isArabic
                    ? "إدارة البرامج"
                    : "Program Management"}
                </span>

                <h2 id="program-trash-title">
                  {isArabic
                    ? "سلة المحذوفات"
                    : "Recycle Bin"}
                </h2>

                <p>
                  {isArabic
                    ? "استعد البرامج التي تم حذفها سابقًا."
                    : "Restore previously deleted programs."}
                </p>
              </div>

              <button
                type="button"
                className="nr-modal-close"
                onClick={() => {
                  setIsTrashOpen(false);
                }}
                aria-label={
                  isArabic
                    ? "إغلاق النافذة"
                    : "Close dialog"
                }
              >
                ×
              </button>
            </div>

            {isDeletedProgramsLoading ? (
              <div className="nr-state">
                <strong>
                  {isArabic
                    ? "جاري تحميل البرامج المحذوفة..."
                    : "Loading deleted programs..."}
                </strong>
              </div>
            ) : isDeletedProgramsError ? (
              <div className="nr-state">
                <strong>
                  {isArabic
                    ? "تعذر تحميل سلة المحذوفات"
                    : "Unable to load recycle bin"}
                </strong>

                <p>
                  {deletedProgramsError instanceof Error
                    ? deletedProgramsError.message
                    : isArabic
                      ? "حدث خطأ غير متوقع."
                      : "An unexpected error occurred."}
                </p>
              </div>
            ) : deletedPrograms.length === 0 ? (
              <div className="nr-state">
                <strong>
                  {isArabic
                    ? "سلة المحذوفات فارغة"
                    : "Recycle bin is empty"}
                </strong>

                <p>
                  {isArabic
                    ? "لا توجد برامج محذوفة حاليًا."
                    : "There are no deleted programs."}
                </p>
              </div>
            ) : (
              <div className="nr-program-trash-list">
                {deletedPrograms.map(
                  (program: Program) => (
                    <article
                      key={program.id}
                      className="nr-program-trash-item"
                    >
                      <div>
                        <span className="nr-dashboard-kicker">
                          {program.slug}
                        </span>

                        <h3>
                          {isArabic
                            ? program.titleAr
                            : program.titleEn}
                        </h3>

                        <p>
                          {program.basePrice}{" "}
                          {program.currencyCode}
                        </p>
                      </div>

                      <div className="nr-program-trash-actions">
                        <button
                          type="button"
                          className="nr-program-action nr-program-action-edit"
                          onClick={() => {
                            void handleRestoreProgram(
                              program.id,
                            );
                          }}
                          disabled={
                            restoringProgramId ===
                              program.id ||
                            permanentlyDeletingProgramId ===
                              program.id
                          }
                        >
                          {restoringProgramId ===
                          program.id
                            ? isArabic
                              ? "جاري الاستعادة..."
                              : "Restoring..."
                            : isArabic
                              ? "استعادة"
                              : "Restore"}
                        </button>

                        <button
                          type="button"
                          className="nr-program-action nr-program-action-delete"
                          onClick={() => {
                            void handlePermanentDeleteProgram(
                              program.id,
                            );
                          }}
                          disabled={
                            permanentlyDeletingProgramId ===
                              program.id ||
                            restoringProgramId ===
                              program.id
                          }
                        >
                          {permanentlyDeletingProgramId ===
                          program.id
                            ? isArabic
                              ? "جاري الحذف..."
                              : "Deleting..."
                            : isArabic
                              ? "حذف نهائي"
                              : "Delete Permanently"}
                        </button>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {isCreateOpen &&
      ((editingProgram && canUpdate) ||
        (!editingProgram && canCreate)) ? (
        <div
          className="nr-modal-backdrop"
          role="presentation"
          onMouseDown={closeCreateDialog}
        >
          <section
            className="nr-modal nr-program-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-program-title"
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="nr-modal-header">
              <div>
                <span className="nr-dashboard-kicker">
                  {isArabic
                    ? "إدارة البرامج"
                    : "Program Management"}
                </span>

                <h2 id="create-program-title">
                  {editingProgram
                    ? isArabic
                      ? "تعديل البرنامج"
                      : "Edit Program"
                    : isArabic
                      ? "إضافة برنامج جديد"
                      : "Add New Program"}
                </h2>

                <p>
                  {isArabic
                    ? "أدخل بيانات البرنامج ثم اضغط حفظ."
                    : "Enter the program details, then select Save."}
                </p>
              </div>

              <button
                type="button"
                className="nr-modal-close"
                onClick={closeCreateDialog}
                aria-label={
                  isArabic
                    ? "إغلاق النافذة"
                    : "Close dialog"
                }
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>

            {isCountriesError ? (
              <p className="nr-admin-login-error">
                {countriesError instanceof Error
                  ? countriesError.message
                  : isArabic
                    ? "تعذر تحميل الدول."
                    : "Unable to load countries."}
              </p>
            ) : null}

            {isHotelsError ? (
              <p className="nr-admin-login-error">
                {hotelsError instanceof Error
                  ? hotelsError.message
                  : isArabic
                    ? "تعذر تحميل الفنادق."
                    : "Unable to load hotels."}
              </p>
            ) : null}

            {isTransportsError ? (
              <p className="nr-admin-login-error">
                {transportsError instanceof Error
                  ? transportsError.message
                  : isArabic
                    ? "تعذر تحميل خدمات النقل."
                    : "Unable to load transport services."}
              </p>
            ) : null}

            {isVisasError ? (
              <p className="nr-admin-login-error">
                {visasError instanceof Error
                  ? visasError.message
                  : isArabic
                    ? "تعذر تحميل خدمات التأشيرات."
                    : "Unable to load visa services."}
              </p>
            ) : null}

            {formError ? (
              <p className="nr-admin-login-error">
                {formError}
              </p>
            ) : null}

            {editingProgram &&
            canUpdate &&
            !canPublish ? (
              <p className="nr-admin-login-error">
                {isArabic
                  ? "يمكنك تعديل بيانات البرنامج، لكن نشره يتطلب صلاحية النشر."
                  : "You can edit program details, but publishing requires publish permission."}
              </p>
            ) : null}

            <ProgramForm
              isCreating={!editingProgram}
              visas={activeVisas.map(
                (visa: ProgramVisaOption) => ({
                  id: visa.id,
                  nameAr: visa.nameAr,
                  nameEn: visa.nameEn,
                  visaType: visa.visaType,
                  processingType: visa.processingType,
                  processingTimeDays: visa.processingTimeDays,
                  validityDays: visa.validityDays,
                  maxStayDays: visa.maxStayDays,
                  basePrice: visa.basePrice,
                  currencyCode: visa.currencyCode,
                }),
              )}
              transports={activeTransports.map(
                (transport: ProgramTransportOption) => ({
                  id: transport.id,
                  nameAr: transport.nameAr,
                  nameEn: transport.nameEn,
                  providerNameAr: transport.providerNameAr,
                  providerNameEn: transport.providerNameEn,
                  serviceType: transport.serviceType,
                  mode: transport.mode,
                  vehicleType: transport.vehicleType,
                  vehicleNameAr: transport.vehicleNameAr,
                  vehicleNameEn: transport.vehicleNameEn,
                  capacity: transport.capacity,
                }),
              )}
              hotels={activeHotels.map(
                (hotel: ProgramHotelOption) => ({
                  id: hotel.id,
                  nameAr: hotel.nameAr,
                  nameEn: hotel.nameEn,
                  cityAr: hotel.cityAr,
                  cityEn: hotel.cityEn,
                  stars: hotel.stars,
                }),
              )}
              countries={countries.map(
                (country: ProgramCountryOption) => ({
                  id: country.id,
                  nameAr:
                    country.nameAr,
                  nameEn:
                    country.nameEn,
                }),
              )}
              initialValues={
                editingProgram
                  ? {
                      titleAr:
                        editingProgram.titleAr,
                      titleEn:
                        editingProgram.titleEn,
                      slug:
                        editingProgram.slug,
                      summaryAr:
                        editingProgram.summaryAr,
                      summaryEn:
                        editingProgram.summaryEn,
                      descriptionAr:
                        editingProgram.descriptionAr,
                      descriptionEn:
                        editingProgram.descriptionEn,
                      countryId:
                        editingProgram.countryId ??
                        "",
                      durationDays:
                        editingProgram.durationDays,
                      durationNights:
                        editingProgram.durationNights,
                      basePrice:
                        editingProgram.basePrice,
                      currencyCode:
                        editingProgram.currencyCode,
                      flightInclusion:
                        editingProgram.flightInclusion,
                      flightNotesAr:
                        editingProgram.flightNotesAr,
                      flightNotesEn:
                        editingProgram.flightNotesEn,
                      status:
                        editingProgram.status,
                      isFeatured:
                        editingProgram.isFeatured,
                      isActive:
                        editingProgram.isActive,
                      sortOrder:
                        editingProgram.sortOrder,
                      hotels:
                        editingProgramHotels,
                      flights:
                        editingProgramFlights,
                      transports:
                        editingProgramTransports,
                      visas:
                        editingProgramVisas,
                    }
                  : undefined
              }
              onSubmit={
                handleCreateProgram
              }
              isSubmitting={
                isSubmitting ||
                isCountriesLoading ||
                isCountriesError ||
                isHotelsLoading ||
                isHotelsError ||
                isTransportsLoading ||
                isTransportsError ||
                isVisasLoading ||
                isVisasError ||
                isEditingHotelsLoading ||
                isEditingFlightsLoading ||
                isEditingTransportsLoading ||
                isEditingVisasLoading
              }
            />
          </section>
        </div>
      ) : null}
    </section>
  );
}