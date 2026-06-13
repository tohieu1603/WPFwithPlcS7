import axios from "axios";
import type { Dashboard, Kpi, ProductionRecord, AlarmRow, Recipe, Station } from "./types";

const baseURL = process.env.NEXT_PUBLIC_API ?? "http://localhost:4000/api";
export const api = axios.create({ baseURL });

export const getDashboard = () => api.get<Dashboard>("/dashboard").then((r) => r.data);

export const getKpiHistory = (take = 40) =>
  api.get<{ rows: Kpi[] }>("/dashboard/kpi-history", { params: { take } }).then((r) => r.data.rows);

export const getStations = () =>
  api.get<{ rows: Station[] }>("/dashboard/stations").then((r) => r.data.rows);

export const getRecords = (params: {
  page?: number;
  pageSize?: number;
  disposition?: string;
  search?: string;
}) =>
  api
    .get<{ rows: ProductionRecord[]; total: number }>("/records", { params })
    .then((r) => r.data);

export const getAlarms = (active?: boolean) =>
  api
    .get<{ rows: AlarmRow[] }>("/alarms", { params: active ? { active: true } : {} })
    .then((r) => r.data.rows);

export const getRecipes = () =>
  api.get<{ rows: Recipe[] }>("/recipes").then((r) => r.data.rows);

export const createRecipe = (body: Partial<Recipe>) =>
  api.post<Recipe>("/recipes", body).then((r) => r.data);

export const updateRecipe = (id: number, body: Partial<Recipe>) =>
  api.put<Recipe>(`/recipes/${id}`, body).then((r) => r.data);

export const deleteRecipe = (id: number) =>
  api.delete(`/recipes/${id}`).then((r) => r.data);
