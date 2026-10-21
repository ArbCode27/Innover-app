import { apiClient } from "@/lib/api-client";
import { mapApiTicket } from "@/lib/map-api-ticket";
import type { AppCaso } from "@/types/domain";

export const fetchCustomerTickets = async (
  status?: string,
): Promise<AppCaso[]> => {
  const payload = await apiClient.getTickets(status);
  return payload.tickets.map(mapApiTicket);
};

export const fetchCustomerTicket = async (
  ticketId: string,
): Promise<AppCaso> => {
  const payload = await apiClient.getTicket(ticketId);
  return mapApiTicket(payload.ticket);
};

export const fetchCustomerOpenTicket = async (): Promise<AppCaso | null> => {
  const tickets = await fetchCustomerTickets("open,scheduled");
  return tickets[0] ?? null;
};
