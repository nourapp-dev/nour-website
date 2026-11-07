export type ProgramHotelFormValue = {
  hotelId: string;

  nights: number;
  occupancy?:number|null;

  roomTypeAr: string;
  roomTypeEn: string;

  mealPlanAr: string;
  mealPlanEn: string;

  checkInDate: string;
  checkOutDate: string;

  notesAr: string;
  notesEn: string;

  sortOrder: number;
};