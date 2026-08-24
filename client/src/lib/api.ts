import axios from "axios";
import type { Stand, Block, Seat, Booking } from "../types";

const api = axios.create({ baseURL: "/api" });

export async function fetchStands(): Promise<Stand[]> {
  const { data } = await api.get("/stands");
  return data;
}

export async function fetchStand(standId: string): Promise<Stand> {
  const { data } = await api.get(`/stands/${standId}`);
  return data;
}

export async function fetchBlocks(standId: string): Promise<Block[]> {
  const { data } = await api.get(`/stands/${standId}/blocks`);
  return data;
}

export async function fetchSeats(blockId: string): Promise<Seat[]> {
  const { data } = await api.get(`/blocks/${blockId}/seats`);
  return data;
}

export async function holdSeats(
  seatIds: string[],
  holdToken?: string
): Promise<{ holdToken: string; expiresAt: number }> {
  const { data } = await api.post("/seats/hold", { seatIds, holdToken });
  return data;
}

export async function releaseSeats(seatIds: string[], holdToken: string): Promise<void> {
  await api.post("/seats/release", { seatIds, holdToken });
}

export async function createBooking(payload: {
  name: string;
  email: string;
  phone: string;
  seatIds: string[];
  holdToken: string;
}): Promise<{ bookingId: string; total: number; createdAt: number }> {
  const { data } = await api.post("/bookings", payload);
  return data;
}

export async function fetchBooking(bookingId: string): Promise<Booking> {
  const { data } = await api.get(`/bookings/${bookingId}`);
  return data;
}

export async function fetchBookingsByEmail(email: string): Promise<Booking[]> {
  const { data } = await api.get(`/bookings`, { params: { email } });
  return data;
}
