// API Service Layer - Export all API modules

export { api } from './client';
export { authApi } from './auth';
export { leadsApi } from './leads';
export { estimatesApi } from './estimates';
export { jobsApi } from './jobs';
export { teamApi } from './team';
export { subcontractorsApi } from './subcontractors';
export { priceBookApi } from './price-book';
export { tractionApi } from './traction';
export { settingsApi } from './settings';
export { dashboardApi } from './dashboard';

// Re-export types
export type { User, AuthResponse, LoginRequest, RegisterRequest } from './auth';
export type { Lead, CreateLeadRequest, UpdateLeadRequest } from './leads';
export type { Estimate, EstimateLineItem, EstimateSignature, CreateEstimateRequest, UpdateEstimateRequest, SignEstimateRequest } from './estimates';
export type { Job, CreateJobRequest, UpdateJobRequest } from './jobs';
export type { TeamMember, CreateTeamMemberRequest, UpdateTeamMemberRequest } from './team';
export type { Subcontractor, CreateSubcontractorRequest, UpdateSubcontractorRequest } from './subcontractors';
export type { RoomPrice, ExteriorPrice, Addon, CreateRoomPriceRequest, CreateExteriorPriceRequest, CreateAddonRequest } from './price-book';
export type { VTO, Rock, Todo, Issue, ScorecardMetric, ScorecardEntry, Meeting } from './traction';
export type { BusinessSettings, CompanyEstimateSettings, PortfolioImage } from './settings';
export type { DashboardStats, RecentActivity, UpcomingItem } from './dashboard';
