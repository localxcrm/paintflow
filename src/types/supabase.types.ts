// Auto-generated Supabase types
// Generated from database schema via Supabase MCP
// DO NOT EDIT MANUALLY - regenerate using `mcp__supabase__generate_typescript_types`

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      Addon: {
        Row: {
          basePrice: number
          category: string | null
          createdAt: string | null
          description: string | null
          id: string
          name: string
          organizationId: string
          unit: string | null
          updatedAt: string | null
        }
        Insert: {
          basePrice: number
          category?: string | null
          createdAt?: string | null
          description?: string | null
          id?: string
          name: string
          organizationId: string
          unit?: string | null
          updatedAt?: string | null
        }
        Update: {
          basePrice?: number
          category?: string | null
          createdAt?: string | null
          description?: string | null
          id?: string
          name?: string
          organizationId?: string
          unit?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Addon_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      AIConversation: {
        Row: {
          context: string | null
          createdAt: string | null
          id: string
          organizationId: string
          sessionId: string | null
          title: string | null
          updatedAt: string | null
          userId: string | null
        }
        Insert: {
          context?: string | null
          createdAt?: string | null
          id?: string
          organizationId: string
          sessionId?: string | null
          title?: string | null
          updatedAt?: string | null
          userId?: string | null
        }
        Update: {
          context?: string | null
          createdAt?: string | null
          id?: string
          organizationId?: string
          sessionId?: string | null
          title?: string | null
          updatedAt?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "AIConversation_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AIConversation_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      AIMessage: {
        Row: {
          content: string
          conversationId: string
          createdAt: string | null
          id: string
          role: string
          suggestedLineItems: Json | null
          suggestedRiskModifiers: Json | null
        }
        Insert: {
          content: string
          conversationId: string
          createdAt?: string | null
          id?: string
          role: string
          suggestedLineItems?: Json | null
          suggestedRiskModifiers?: Json | null
        }
        Update: {
          content?: string
          conversationId?: string
          createdAt?: string | null
          id?: string
          role?: string
          suggestedLineItems?: Json | null
          suggestedRiskModifiers?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "AIMessage_conversationId_fkey"
            columns: ["conversationId"]
            isOneToOne: false
            referencedRelation: "AIConversation"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          created_at: string
          focus: string | null
          id: string
          metric: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          focus?: string | null
          id?: string
          metric?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          focus?: string | null
          id?: string
          metric?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      BusinessSettings: {
        Row: {
          address: string | null
          arTargetDays: number | null
          city: string | null
          companyName: string | null
          createdAt: string | null
          defaultDepositPct: number | null
          email: string | null
          id: string
          logo: string | null
          marketingChannels: Json | null
          minGrossProfitPerJob: number | null
          organizationId: string
          phone: string | null
          priceRoundingIncrement: number | null
          state: string | null
          subLaborPct: number | null
          subMaterialsPct: number | null
          subPayoutPct: number | null
          targetGrossMarginPct: number | null
          taxId: string | null
          updatedAt: string | null
          website: string | null
          zipCode: string | null
        }
        Insert: {
          address?: string | null
          arTargetDays?: number | null
          city?: string | null
          companyName?: string | null
          createdAt?: string | null
          defaultDepositPct?: number | null
          email?: string | null
          id?: string
          logo?: string | null
          marketingChannels?: Json | null
          minGrossProfitPerJob?: number | null
          organizationId: string
          phone?: string | null
          priceRoundingIncrement?: number | null
          state?: string | null
          subLaborPct?: number | null
          subMaterialsPct?: number | null
          subPayoutPct?: number | null
          targetGrossMarginPct?: number | null
          taxId?: string | null
          updatedAt?: string | null
          website?: string | null
          zipCode?: string | null
        }
        Update: {
          address?: string | null
          arTargetDays?: number | null
          city?: string | null
          companyName?: string | null
          createdAt?: string | null
          defaultDepositPct?: number | null
          email?: string | null
          id?: string
          logo?: string | null
          marketingChannels?: Json | null
          minGrossProfitPerJob?: number | null
          organizationId?: string
          phone?: string | null
          priceRoundingIncrement?: number | null
          state?: string | null
          subLaborPct?: number | null
          subMaterialsPct?: number | null
          subPayoutPct?: number | null
          targetGrossMarginPct?: number | null
          taxId?: string | null
          updatedAt?: string | null
          website?: string | null
          zipCode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "BusinessSettings_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: true
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Chat: {
        Row: {
          createdAt: string
          id: string
          lastMessageAt: string | null
          lastMessagePreview: string | null
          organizationId: string
          subcontractorId: string | null
          unreadCountCompany: number
          unreadCountSubcontractor: number
          updatedAt: string
          workOrderId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          lastMessageAt?: string | null
          lastMessagePreview?: string | null
          organizationId: string
          subcontractorId?: string | null
          unreadCountCompany?: number
          unreadCountSubcontractor?: number
          updatedAt?: string
          workOrderId: string
        }
        Update: {
          createdAt?: string
          id?: string
          lastMessageAt?: string | null
          lastMessagePreview?: string | null
          organizationId?: string
          subcontractorId?: string | null
          unreadCountCompany?: number
          unreadCountSubcontractor?: number
          updatedAt?: string
          workOrderId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Chat_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Chat_subcontractorId_fkey"
            columns: ["subcontractorId"]
            isOneToOne: false
            referencedRelation: "Subcontractor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Chat_workOrderId_fkey"
            columns: ["workOrderId"]
            isOneToOne: true
            referencedRelation: "WorkOrder"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          channel?: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      ChatMessage: {
        Row: {
          authorId: string | null
          authorName: string
          authorType: string
          chatId: string
          createdAt: string
          id: string
          isRead: boolean
          mediaDuration: number | null
          mediaPath: string | null
          mediaThumbnail: string | null
          mediaUrl: string | null
          text: string | null
          type: string
        }
        Insert: {
          authorId?: string | null
          authorName: string
          authorType: string
          chatId: string
          createdAt?: string
          id?: string
          isRead?: boolean
          mediaDuration?: number | null
          mediaPath?: string | null
          mediaThumbnail?: string | null
          mediaUrl?: string | null
          text?: string | null
          type?: string
        }
        Update: {
          authorId?: string | null
          authorName?: string
          authorType?: string
          chatId?: string
          createdAt?: string
          id?: string
          isRead?: boolean
          mediaDuration?: number | null
          mediaPath?: string | null
          mediaThumbnail?: string | null
          mediaUrl?: string | null
          text?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ChatMessage_authorId_fkey"
            columns: ["authorId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ChatMessage_chatId_fkey"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_actions: {
        Row: {
          action_type: string
          created_at: string
          id: string
          payload: Json
          reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          payload: Json
          reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          payload?: Json
          reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      CompanyEstimateSettings: {
        Row: {
          createdAt: string | null
          defaultNotes: string | null
          defaultTerms: string | null
          estimatePrefix: string | null
          id: string
          insuranceCertificateUrl: string | null
          insuranceCompany: string | null
          insuranceCoverageAmount: number | null
          insuranceExpirationDate: string | null
          insurancePolicyNumber: string | null
          licenseExpirationDate: string | null
          licenseImageUrl: string | null
          licenseNumber: string | null
          licenseState: string | null
          nextEstimateNumber: number | null
          organizationId: string
          paymentTerms: string | null
          taxRate: number | null
          termsAndConditions: string | null
          updatedAt: string | null
          warrantyTerms: string | null
        }
        Insert: {
          createdAt?: string | null
          defaultNotes?: string | null
          defaultTerms?: string | null
          estimatePrefix?: string | null
          id?: string
          insuranceCertificateUrl?: string | null
          insuranceCompany?: string | null
          insuranceCoverageAmount?: number | null
          insuranceExpirationDate?: string | null
          insurancePolicyNumber?: string | null
          licenseExpirationDate?: string | null
          licenseImageUrl?: string | null
          licenseNumber?: string | null
          licenseState?: string | null
          nextEstimateNumber?: number | null
          organizationId: string
          paymentTerms?: string | null
          taxRate?: number | null
          termsAndConditions?: string | null
          updatedAt?: string | null
          warrantyTerms?: string | null
        }
        Update: {
          createdAt?: string | null
          defaultNotes?: string | null
          defaultTerms?: string | null
          estimatePrefix?: string | null
          id?: string
          insuranceCertificateUrl?: string | null
          insuranceCompany?: string | null
          insuranceCoverageAmount?: number | null
          insuranceExpirationDate?: string | null
          insurancePolicyNumber?: string | null
          licenseExpirationDate?: string | null
          licenseImageUrl?: string | null
          licenseNumber?: string | null
          licenseState?: string | null
          nextEstimateNumber?: number | null
          organizationId?: string
          paymentTerms?: string | null
          taxRate?: number | null
          termsAndConditions?: string | null
          updatedAt?: string | null
          warrantyTerms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "CompanyEstimateSettings_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: true
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Estimate: {
        Row: {
          acceptedAt: string | null
          address: string | null
          city: string | null
          clientEmail: string | null
          clientName: string
          clientPhone: string | null
          createdAt: string | null
          discountAmount: number | null
          estimateDate: string | null
          estimateNumber: string
          grossMarginPct: number | null
          grossProfit: number | null
          id: string
          leadId: string | null
          meetsMinGp: boolean | null
          meetsTargetGm: boolean | null
          notes: string | null
          organizationId: string
          sentAt: string | null
          state: string | null
          status: string | null
          subLaborCost: number | null
          subMaterialsCost: number | null
          subtotal: number | null
          subTotalCost: number | null
          terms: string | null
          totalPrice: number | null
          updatedAt: string | null
          validUntil: string | null
          viewedAt: string | null
          zipCode: string | null
        }
        Insert: {
          acceptedAt?: string | null
          address?: string | null
          city?: string | null
          clientEmail?: string | null
          clientName: string
          clientPhone?: string | null
          createdAt?: string | null
          discountAmount?: number | null
          estimateDate?: string | null
          estimateNumber: string
          grossMarginPct?: number | null
          grossProfit?: number | null
          id?: string
          leadId?: string | null
          meetsMinGp?: boolean | null
          meetsTargetGm?: boolean | null
          notes?: string | null
          organizationId: string
          sentAt?: string | null
          state?: string | null
          status?: string | null
          subLaborCost?: number | null
          subMaterialsCost?: number | null
          subtotal?: number | null
          subTotalCost?: number | null
          terms?: string | null
          totalPrice?: number | null
          updatedAt?: string | null
          validUntil?: string | null
          viewedAt?: string | null
          zipCode?: string | null
        }
        Update: {
          acceptedAt?: string | null
          address?: string | null
          city?: string | null
          clientEmail?: string | null
          clientName?: string
          clientPhone?: string | null
          createdAt?: string | null
          discountAmount?: number | null
          estimateDate?: string | null
          estimateNumber?: string
          grossMarginPct?: number | null
          grossProfit?: number | null
          id?: string
          leadId?: string | null
          meetsMinGp?: boolean | null
          meetsTargetGm?: boolean | null
          notes?: string | null
          organizationId?: string
          sentAt?: string | null
          state?: string | null
          status?: string | null
          subLaborCost?: number | null
          subMaterialsCost?: number | null
          subtotal?: number | null
          subTotalCost?: number | null
          terms?: string | null
          totalPrice?: number | null
          updatedAt?: string | null
          validUntil?: string | null
          viewedAt?: string | null
          zipCode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Estimate_leadId_fkey"
            columns: ["leadId"]
            isOneToOne: false
            referencedRelation: "Lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Estimate_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      EstimateLineItem: {
        Row: {
          createdAt: string | null
          description: string
          estimateId: string
          id: string
          lineTotal: number
          location: string | null
          quantity: number | null
          scope: string | null
          sortOrder: number | null
          unitPrice: number
        }
        Insert: {
          createdAt?: string | null
          description: string
          estimateId: string
          id?: string
          lineTotal: number
          location?: string | null
          quantity?: number | null
          scope?: string | null
          sortOrder?: number | null
          unitPrice: number
        }
        Update: {
          createdAt?: string | null
          description?: string
          estimateId?: string
          id?: string
          lineTotal?: number
          location?: string | null
          quantity?: number | null
          scope?: string | null
          sortOrder?: number | null
          unitPrice?: number
        }
        Relationships: [
          {
            foreignKeyName: "EstimateLineItem_estimateId_fkey"
            columns: ["estimateId"]
            isOneToOne: false
            referencedRelation: "Estimate"
            referencedColumns: ["id"]
          },
        ]
      }
      EstimateSignature: {
        Row: {
          clientName: string
          estimateId: string
          id: string
          ipAddress: string | null
          signatureDataUrl: string
          signedAt: string | null
        }
        Insert: {
          clientName: string
          estimateId: string
          id?: string
          ipAddress?: string | null
          signatureDataUrl: string
          signedAt?: string | null
        }
        Update: {
          clientName?: string
          estimateId?: string
          id?: string
          ipAddress?: string | null
          signatureDataUrl?: string
          signedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "EstimateSignature_estimateId_fkey"
            columns: ["estimateId"]
            isOneToOne: false
            referencedRelation: "Estimate"
            referencedColumns: ["id"]
          },
        ]
      }
      ExteriorPrice: {
        Row: {
          createdAt: string | null
          id: string
          organizationId: string
          prepMultiplier: number | null
          pricePerSqft: number
          surfaceType: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          id?: string
          organizationId: string
          prepMultiplier?: number | null
          pricePerSqft: number
          surfaceType: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          id?: string
          organizationId?: string
          prepMultiplier?: number | null
          pricePerSqft?: number
          surfaceType?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ExteriorPrice_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_items: {
        Row: {
          created_at: string
          done: boolean
          id: string
          label: string
          list: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          label: string
          list: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          label?: string
          list?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      GhlLocation: {
        Row: {
          createdAt: string | null
          ghlLocationId: string
          id: string
          locationName: string | null
          organizationId: string
        }
        Insert: {
          createdAt?: string | null
          ghlLocationId: string
          id?: string
          locationName?: string | null
          organizationId: string
        }
        Update: {
          createdAt?: string | null
          ghlLocationId?: string
          id?: string
          locationName?: string | null
          organizationId?: string
        }
        Relationships: [
          {
            foreignKeyName: "GhlLocation_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          area: string | null
          cadence: string | null
          created_at: string
          id: string
          next_step: string | null
          progress: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: string | null
          cadence?: string | null
          created_at?: string
          id?: string
          next_step?: string | null
          progress?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string | null
          cadence?: string | null
          created_at?: string
          id?: string
          next_step?: string | null
          progress?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      Invitation: {
        Row: {
          acceptedAt: string | null
          createdAt: string | null
          email: string
          expiresAt: string
          id: string
          invitedBy: string | null
          organizationId: string
          role: string | null
          token: string
        }
        Insert: {
          acceptedAt?: string | null
          createdAt?: string | null
          email: string
          expiresAt: string
          id?: string
          invitedBy?: string | null
          organizationId: string
          role?: string | null
          token: string
        }
        Update: {
          acceptedAt?: string | null
          createdAt?: string | null
          email?: string
          expiresAt?: string
          id?: string
          invitedBy?: string | null
          organizationId?: string
          role?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "Invitation_invitedBy_fkey"
            columns: ["invitedBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Invitation_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Issue: {
        Row: {
          createdAt: string | null
          createdBy: string | null
          description: string | null
          id: string
          issueType: string | null
          organizationId: string
          priority: number | null
          resolution: string | null
          resolvedAt: string | null
          status: string | null
          title: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          createdBy?: string | null
          description?: string | null
          id?: string
          issueType?: string | null
          organizationId: string
          priority?: number | null
          resolution?: string | null
          resolvedAt?: string | null
          status?: string | null
          title: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          createdBy?: string | null
          description?: string | null
          id?: string
          issueType?: string | null
          organizationId?: string
          priority?: number | null
          resolution?: string | null
          resolvedAt?: string | null
          status?: string | null
          title?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Issue_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Job: {
        Row: {
          actualEndDate: string | null
          actualStartDate: string | null
          address: string | null
          balanceDue: number | null
          city: string | null
          clientName: string
          createdAt: string | null
          daysToCollect: number | null
          depositPaid: boolean | null
          depositPaymentDate: string | null
          depositPaymentMethod: string | null
          depositRequired: number | null
          estimateId: string | null
          grossMarginPct: number | null
          grossProfit: number | null
          id: string
          invoiceDate: string | null
          jobDate: string | null
          jobNumber: string
          jobPaid: boolean | null
          jobPaymentDate: string | null
          jobPaymentMethod: string | null
          jobValue: number | null
          latitude: number | null
          leadId: string | null
          longitude: number | null
          meetsMinGp: boolean | null
          meetsTargetGm: boolean | null
          notes: string | null
          organizationId: string
          paymentHistory: Json | null
          paymentReceivedDate: string | null
          photos: Json | null
          pmCommissionAmount: number | null
          pmCommissionPaid: boolean | null
          pmCommissionPct: number | null
          profitFlag: string | null
          projectManagerId: string | null
          projectType: string | null
          salesCommissionAmount: number | null
          salesCommissionPaid: boolean | null
          salesCommissionPct: number | null
          salesRepId: string | null
          scheduledEndDate: string | null
          scheduledStartDate: string | null
          state: string | null
          status: string | null
          subcontractorId: string | null
          subcontractorPaid: boolean | null
          subcontractorPrice: number | null
          subLabor: number | null
          subMaterials: number | null
          subTotal: number | null
          updatedAt: string | null
          zipCode: string | null
        }
        Insert: {
          actualEndDate?: string | null
          actualStartDate?: string | null
          address?: string | null
          balanceDue?: number | null
          city?: string | null
          clientName: string
          createdAt?: string | null
          daysToCollect?: number | null
          depositPaid?: boolean | null
          depositPaymentDate?: string | null
          depositPaymentMethod?: string | null
          depositRequired?: number | null
          estimateId?: string | null
          grossMarginPct?: number | null
          grossProfit?: number | null
          id?: string
          invoiceDate?: string | null
          jobDate?: string | null
          jobNumber: string
          jobPaid?: boolean | null
          jobPaymentDate?: string | null
          jobPaymentMethod?: string | null
          jobValue?: number | null
          latitude?: number | null
          leadId?: string | null
          longitude?: number | null
          meetsMinGp?: boolean | null
          meetsTargetGm?: boolean | null
          notes?: string | null
          organizationId: string
          paymentHistory?: Json | null
          paymentReceivedDate?: string | null
          photos?: Json | null
          pmCommissionAmount?: number | null
          pmCommissionPaid?: boolean | null
          pmCommissionPct?: number | null
          profitFlag?: string | null
          projectManagerId?: string | null
          projectType?: string | null
          salesCommissionAmount?: number | null
          salesCommissionPaid?: boolean | null
          salesCommissionPct?: number | null
          salesRepId?: string | null
          scheduledEndDate?: string | null
          scheduledStartDate?: string | null
          state?: string | null
          status?: string | null
          subcontractorId?: string | null
          subcontractorPaid?: boolean | null
          subcontractorPrice?: number | null
          subLabor?: number | null
          subMaterials?: number | null
          subTotal?: number | null
          updatedAt?: string | null
          zipCode?: string | null
        }
        Update: {
          actualEndDate?: string | null
          actualStartDate?: string | null
          address?: string | null
          balanceDue?: number | null
          city?: string | null
          clientName?: string
          createdAt?: string | null
          daysToCollect?: number | null
          depositPaid?: boolean | null
          depositPaymentDate?: string | null
          depositPaymentMethod?: string | null
          depositRequired?: number | null
          estimateId?: string | null
          grossMarginPct?: number | null
          grossProfit?: number | null
          id?: string
          invoiceDate?: string | null
          jobDate?: string | null
          jobNumber?: string
          jobPaid?: boolean | null
          jobPaymentDate?: string | null
          jobPaymentMethod?: string | null
          jobValue?: number | null
          latitude?: number | null
          leadId?: string | null
          longitude?: number | null
          meetsMinGp?: boolean | null
          meetsTargetGm?: boolean | null
          notes?: string | null
          organizationId?: string
          paymentHistory?: Json | null
          paymentReceivedDate?: string | null
          photos?: Json | null
          pmCommissionAmount?: number | null
          pmCommissionPaid?: boolean | null
          pmCommissionPct?: number | null
          profitFlag?: string | null
          projectManagerId?: string | null
          projectType?: string | null
          salesCommissionAmount?: number | null
          salesCommissionPaid?: boolean | null
          salesCommissionPct?: number | null
          salesRepId?: string | null
          scheduledEndDate?: string | null
          scheduledStartDate?: string | null
          state?: string | null
          status?: string | null
          subcontractorId?: string | null
          subcontractorPaid?: boolean | null
          subcontractorPrice?: number | null
          subLabor?: number | null
          subMaterials?: number | null
          subTotal?: number | null
          updatedAt?: string | null
          zipCode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Job_estimateId_fkey"
            columns: ["estimateId"]
            isOneToOne: false
            referencedRelation: "Estimate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Job_leadId_fkey"
            columns: ["leadId"]
            isOneToOne: false
            referencedRelation: "Lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Job_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Job_projectManagerId_fkey"
            columns: ["projectManagerId"]
            isOneToOne: false
            referencedRelation: "TeamMember"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Job_salesRepId_fkey"
            columns: ["salesRepId"]
            isOneToOne: false
            referencedRelation: "TeamMember"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Job_subcontractorId_fkey"
            columns: ["subcontractorId"]
            isOneToOne: false
            referencedRelation: "Subcontractor"
            referencedColumns: ["id"]
          },
        ]
      }
      KnowledgeArticle: {
        Row: {
          category: string
          checklist: Json | null
          content: string | null
          createdAt: string | null
          createdBy: string | null
          id: string
          images: Json | null
          isPublished: boolean | null
          organizationId: string
          title: string
          updatedAt: string | null
          videoUrl: string | null
        }
        Insert: {
          category: string
          checklist?: Json | null
          content?: string | null
          createdAt?: string | null
          createdBy?: string | null
          id?: string
          images?: Json | null
          isPublished?: boolean | null
          organizationId: string
          title: string
          updatedAt?: string | null
          videoUrl?: string | null
        }
        Update: {
          category?: string
          checklist?: Json | null
          content?: string | null
          createdAt?: string | null
          createdBy?: string | null
          id?: string
          images?: Json | null
          isPublished?: boolean | null
          organizationId?: string
          title?: string
          updatedAt?: string | null
          videoUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "KnowledgeArticle_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "KnowledgeArticle_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Lead: {
        Row: {
          address: string | null
          assignedToId: string | null
          city: string | null
          createdAt: string | null
          email: string | null
          estimatedJobValue: number | null
          firstName: string
          id: string
          lastName: string
          leadDate: string | null
          nextFollowupDate: string | null
          notes: string | null
          organizationId: string
          phone: string | null
          projectType: string | null
          source: string | null
          state: string | null
          status: string | null
          updatedAt: string | null
          wonLostReason: string | null
          zipCode: string | null
        }
        Insert: {
          address?: string | null
          assignedToId?: string | null
          city?: string | null
          createdAt?: string | null
          email?: string | null
          estimatedJobValue?: number | null
          firstName: string
          id?: string
          lastName: string
          leadDate?: string | null
          nextFollowupDate?: string | null
          notes?: string | null
          organizationId: string
          phone?: string | null
          projectType?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          updatedAt?: string | null
          wonLostReason?: string | null
          zipCode?: string | null
        }
        Update: {
          address?: string | null
          assignedToId?: string | null
          city?: string | null
          createdAt?: string | null
          email?: string | null
          estimatedJobValue?: number | null
          firstName?: string
          id?: string
          lastName?: string
          leadDate?: string | null
          nextFollowupDate?: string | null
          notes?: string | null
          organizationId?: string
          phone?: string | null
          projectType?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          updatedAt?: string | null
          wonLostReason?: string | null
          zipCode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Lead_assignedToId_fkey"
            columns: ["assignedToId"]
            isOneToOne: false
            referencedRelation: "TeamMember"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Lead_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      MarketingSpend: {
        Row: {
          amount: number
          createdAt: string | null
          id: string
          leads: number | null
          month: number
          notes: string | null
          organizationId: string
          source: string
          updatedAt: string | null
          year: number
        }
        Insert: {
          amount: number
          createdAt?: string | null
          id?: string
          leads?: number | null
          month: number
          notes?: string | null
          organizationId: string
          source: string
          updatedAt?: string | null
          year: number
        }
        Update: {
          amount?: number
          createdAt?: string | null
          id?: string
          leads?: number | null
          month?: number
          notes?: string | null
          organizationId?: string
          source?: string
          updatedAt?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "MarketingSpend_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Meeting: {
        Row: {
          attendees: Json | null
          createdAt: string | null
          duration: number | null
          headlines: string | null
          id: string
          meetingDate: string
          meetingType: string | null
          notes: string | null
          organizationId: string
          ratingAvg: number | null
          segueNotes: string | null
          status: string | null
          title: string | null
          updatedAt: string | null
        }
        Insert: {
          attendees?: Json | null
          createdAt?: string | null
          duration?: number | null
          headlines?: string | null
          id?: string
          meetingDate: string
          meetingType?: string | null
          notes?: string | null
          organizationId: string
          ratingAvg?: number | null
          segueNotes?: string | null
          status?: string | null
          title?: string | null
          updatedAt?: string | null
        }
        Update: {
          attendees?: Json | null
          createdAt?: string | null
          duration?: number | null
          headlines?: string | null
          id?: string
          meetingDate?: string
          meetingType?: string | null
          notes?: string | null
          organizationId?: string
          ratingAvg?: number | null
          segueNotes?: string | null
          status?: string | null
          title?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Meeting_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Organization: {
        Row: {
          address: string | null
          city: string | null
          createdAt: string | null
          currency: string | null
          email: string | null
          id: string
          isActive: boolean | null
          logo: string | null
          name: string
          phone: string | null
          plan: string | null
          planExpiresAt: string | null
          settings: Json | null
          slug: string
          state: string | null
          stripeCustomerId: string | null
          stripeSubscriptionId: string | null
          timezone: string | null
          updatedAt: string | null
          website: string | null
          zipCode: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          createdAt?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          isActive?: boolean | null
          logo?: string | null
          name: string
          phone?: string | null
          plan?: string | null
          planExpiresAt?: string | null
          settings?: Json | null
          slug: string
          state?: string | null
          stripeCustomerId?: string | null
          stripeSubscriptionId?: string | null
          timezone?: string | null
          updatedAt?: string | null
          website?: string | null
          zipCode?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          createdAt?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          isActive?: boolean | null
          logo?: string | null
          name?: string
          phone?: string | null
          plan?: string | null
          planExpiresAt?: string | null
          settings?: Json | null
          slug?: string
          state?: string | null
          stripeCustomerId?: string | null
          stripeSubscriptionId?: string | null
          timezone?: string | null
          updatedAt?: string | null
          website?: string | null
          zipCode?: string | null
        }
        Relationships: []
      }
      PasswordReset: {
        Row: {
          createdAt: string | null
          expiresAt: string
          id: string
          token: string
          usedAt: string | null
          userId: string
        }
        Insert: {
          createdAt?: string | null
          expiresAt: string
          id?: string
          token: string
          usedAt?: string | null
          userId: string
        }
        Update: {
          createdAt?: string | null
          expiresAt?: string
          id?: string
          token?: string
          usedAt?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "PasswordReset_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      PeopleAnalyzer: {
        Row: {
          coreValueRatings: Json | null
          createdAt: string | null
          gwcCapacity: boolean | null
          gwcGetsIt: boolean | null
          gwcWantsIt: boolean | null
          id: string
          notes: string | null
          organizationId: string
          overallStatus: string | null
          personId: string
          personName: string
          reviewDate: string | null
          updatedAt: string | null
        }
        Insert: {
          coreValueRatings?: Json | null
          createdAt?: string | null
          gwcCapacity?: boolean | null
          gwcGetsIt?: boolean | null
          gwcWantsIt?: boolean | null
          id?: string
          notes?: string | null
          organizationId: string
          overallStatus?: string | null
          personId: string
          personName: string
          reviewDate?: string | null
          updatedAt?: string | null
        }
        Update: {
          coreValueRatings?: Json | null
          createdAt?: string | null
          gwcCapacity?: boolean | null
          gwcGetsIt?: boolean | null
          gwcWantsIt?: boolean | null
          id?: string
          notes?: string | null
          organizationId?: string
          overallStatus?: string | null
          personId?: string
          personName?: string
          reviewDate?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "PeopleAnalyzer_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      PortfolioImage: {
        Row: {
          afterUrl: string | null
          beforeUrl: string | null
          createdAt: string | null
          description: string | null
          id: string
          isFeatured: boolean | null
          jobId: string | null
          organizationId: string
          projectType: string | null
          sortOrder: number | null
        }
        Insert: {
          afterUrl?: string | null
          beforeUrl?: string | null
          createdAt?: string | null
          description?: string | null
          id?: string
          isFeatured?: boolean | null
          jobId?: string | null
          organizationId: string
          projectType?: string | null
          sortOrder?: number | null
        }
        Update: {
          afterUrl?: string | null
          beforeUrl?: string | null
          createdAt?: string | null
          description?: string | null
          id?: string
          isFeatured?: boolean | null
          jobId?: string | null
          organizationId?: string
          projectType?: string | null
          sortOrder?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "PortfolioImage_jobId_fkey"
            columns: ["jobId"]
            isOneToOne: false
            referencedRelation: "Job"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PortfolioImage_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      PushSubscription: {
        Row: {
          createdAt: string
          endpoint: string
          id: string
          keys: Json
          organizationId: string | null
          updatedAt: string
          userType: string
          workOrderToken: string | null
        }
        Insert: {
          createdAt?: string
          endpoint: string
          id?: string
          keys: Json
          organizationId?: string | null
          updatedAt?: string
          userType: string
          workOrderToken?: string | null
        }
        Update: {
          createdAt?: string
          endpoint?: string
          id?: string
          keys?: Json
          organizationId?: string | null
          updatedAt?: string
          userType?: string
          workOrderToken?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "PushSubscription_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          next_outcomes: string[] | null
          period: string
          stressors: string[] | null
          summary: string
          updated_at: string
          user_id: string
          wins: string[] | null
        }
        Insert: {
          created_at?: string
          id?: string
          next_outcomes?: string[] | null
          period: string
          stressors?: string[] | null
          summary: string
          updated_at?: string
          user_id: string
          wins?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          next_outcomes?: string[] | null
          period?: string
          stressors?: string[] | null
          summary?: string
          updated_at?: string
          user_id?: string
          wins?: string[] | null
        }
        Relationships: []
      }
      Rock: {
        Row: {
          createdAt: string | null
          description: string | null
          dueDate: string | null
          id: string
          milestones: Json | null
          organizationId: string
          owner: string
          quarter: number
          rockType: string | null
          status: string | null
          statusHistory: Json | null
          title: string
          updatedAt: string | null
          year: number
        }
        Insert: {
          createdAt?: string | null
          description?: string | null
          dueDate?: string | null
          id?: string
          milestones?: Json | null
          organizationId: string
          owner: string
          quarter: number
          rockType?: string | null
          status?: string | null
          statusHistory?: Json | null
          title: string
          updatedAt?: string | null
          year: number
        }
        Update: {
          createdAt?: string | null
          description?: string | null
          dueDate?: string | null
          id?: string
          milestones?: Json | null
          organizationId?: string
          owner?: string
          quarter?: number
          rockType?: string | null
          status?: string | null
          statusHistory?: Json | null
          title?: string
          updatedAt?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "Rock_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      RoomPrice: {
        Row: {
          createdAt: string | null
          fullRefresh: number | null
          id: string
          organizationId: string
          roomType: string
          size: string
          typicalSqft: number | null
          updatedAt: string | null
          wallsOnly: number | null
          wallsTrim: number | null
          wallsTrimCeiling: number | null
        }
        Insert: {
          createdAt?: string | null
          fullRefresh?: number | null
          id?: string
          organizationId: string
          roomType: string
          size: string
          typicalSqft?: number | null
          updatedAt?: string | null
          wallsOnly?: number | null
          wallsTrim?: number | null
          wallsTrimCeiling?: number | null
        }
        Update: {
          createdAt?: string | null
          fullRefresh?: number | null
          id?: string
          organizationId?: string
          roomType?: string
          size?: string
          typicalSqft?: number | null
          updatedAt?: string | null
          wallsOnly?: number | null
          wallsTrim?: number | null
          wallsTrimCeiling?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "RoomPrice_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      RoomType: {
        Row: {
          createdAt: string
          defaultScope: Json | null
          description: string | null
          id: string
          isActive: boolean | null
          name: string
          order: number | null
          organizationId: string
          type: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          defaultScope?: Json | null
          description?: string | null
          id?: string
          isActive?: boolean | null
          name: string
          order?: number | null
          organizationId: string
          type?: string | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          defaultScope?: Json | null
          description?: string | null
          id?: string
          isActive?: boolean | null
          name?: string
          order?: number | null
          organizationId?: string
          type?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "RoomType_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      ScorecardEntry: {
        Row: {
          actualValue: number
          createdAt: string | null
          id: string
          metricId: string
          notes: string | null
          onTrack: boolean | null
          weekEndingDate: string
        }
        Insert: {
          actualValue: number
          createdAt?: string | null
          id?: string
          metricId: string
          notes?: string | null
          onTrack?: boolean | null
          weekEndingDate: string
        }
        Update: {
          actualValue?: number
          createdAt?: string | null
          id?: string
          metricId?: string
          notes?: string | null
          onTrack?: boolean | null
          weekEndingDate?: string
        }
        Relationships: [
          {
            foreignKeyName: "ScorecardEntry_metricId_fkey"
            columns: ["metricId"]
            isOneToOne: false
            referencedRelation: "ScorecardMetric"
            referencedColumns: ["id"]
          },
        ]
      }
      ScorecardMetric: {
        Row: {
          category: string | null
          createdAt: string | null
          description: string | null
          goalDirection: string | null
          goalType: string | null
          goalValue: number
          id: string
          isActive: boolean | null
          name: string
          organizationId: string
          owner: string
          sortOrder: number | null
          updatedAt: string | null
        }
        Insert: {
          category?: string | null
          createdAt?: string | null
          description?: string | null
          goalDirection?: string | null
          goalType?: string | null
          goalValue: number
          id?: string
          isActive?: boolean | null
          name: string
          organizationId: string
          owner: string
          sortOrder?: number | null
          updatedAt?: string | null
        }
        Update: {
          category?: string | null
          createdAt?: string | null
          description?: string | null
          goalDirection?: string | null
          goalType?: string | null
          goalValue?: number
          id?: string
          isActive?: boolean | null
          name?: string
          organizationId?: string
          owner?: string
          sortOrder?: number | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ScorecardMetric_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Seat: {
        Row: {
          createdAt: string | null
          gwcCapacity: boolean | null
          gwcGetsIt: boolean | null
          gwcWantsIt: boolean | null
          id: string
          isRightPersonRightSeat: boolean | null
          organizationId: string
          personId: string | null
          personName: string | null
          reportsToId: string | null
          responsibilities: Json | null
          roleDescription: string | null
          seatName: string
          sortOrder: number | null
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          gwcCapacity?: boolean | null
          gwcGetsIt?: boolean | null
          gwcWantsIt?: boolean | null
          id?: string
          isRightPersonRightSeat?: boolean | null
          organizationId: string
          personId?: string | null
          personName?: string | null
          reportsToId?: string | null
          responsibilities?: Json | null
          roleDescription?: string | null
          seatName: string
          sortOrder?: number | null
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          gwcCapacity?: boolean | null
          gwcGetsIt?: boolean | null
          gwcWantsIt?: boolean | null
          id?: string
          isRightPersonRightSeat?: boolean | null
          organizationId?: string
          personId?: string | null
          personName?: string | null
          reportsToId?: string | null
          responsibilities?: Json | null
          roleDescription?: string | null
          seatName?: string
          sortOrder?: number | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Seat_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Seat_reportsToId_fkey"
            columns: ["reportsToId"]
            isOneToOne: false
            referencedRelation: "Seat"
            referencedColumns: ["id"]
          },
        ]
      }
      Session: {
        Row: {
          createdAt: string | null
          expiresAt: string
          id: string
          ipAddress: string | null
          organizationId: string | null
          token: string
          userAgent: string | null
          userId: string
        }
        Insert: {
          createdAt?: string | null
          expiresAt: string
          id?: string
          ipAddress?: string | null
          organizationId?: string | null
          token: string
          userAgent?: string | null
          userId: string
        }
        Update: {
          createdAt?: string | null
          expiresAt?: string
          id?: string
          ipAddress?: string | null
          organizationId?: string | null
          token?: string
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Session_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Subcontractor: {
        Row: {
          calendarToken: string | null
          color: string | null
          companyName: string | null
          createdAt: string | null
          defaultPayoutPct: number | null
          email: string | null
          id: string
          isActive: boolean | null
          name: string
          notes: string | null
          organizationId: string
          phone: string | null
          specialty: string | null
          updatedAt: string | null
          userId: string | null
        }
        Insert: {
          calendarToken?: string | null
          color?: string | null
          companyName?: string | null
          createdAt?: string | null
          defaultPayoutPct?: number | null
          email?: string | null
          id?: string
          isActive?: boolean | null
          name: string
          notes?: string | null
          organizationId: string
          phone?: string | null
          specialty?: string | null
          updatedAt?: string | null
          userId?: string | null
        }
        Update: {
          calendarToken?: string | null
          color?: string | null
          companyName?: string | null
          createdAt?: string | null
          defaultPayoutPct?: number | null
          email?: string | null
          id?: string
          isActive?: boolean | null
          name?: string
          notes?: string | null
          organizationId?: string
          phone?: string | null
          specialty?: string | null
          updatedAt?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Subcontractor_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Subcontractor_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      SubcontractorTraining: {
        Row: {
          category: string
          checklist: Json | null
          content: string | null
          courseId: string | null
          createdAt: string | null
          id: string
          images: Json | null
          isPublished: boolean | null
          order: number | null
          organizationId: string
          title: string
          updatedAt: string | null
          videoUrl: string | null
        }
        Insert: {
          category?: string
          checklist?: Json | null
          content?: string | null
          courseId?: string | null
          createdAt?: string | null
          id?: string
          images?: Json | null
          isPublished?: boolean | null
          order?: number | null
          organizationId: string
          title: string
          updatedAt?: string | null
          videoUrl?: string | null
        }
        Update: {
          category?: string
          checklist?: Json | null
          content?: string | null
          courseId?: string | null
          createdAt?: string | null
          id?: string
          images?: Json | null
          isPublished?: boolean | null
          order?: number | null
          organizationId?: string
          title?: string
          updatedAt?: string | null
          videoUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "SubcontractorTraining_courseId_fkey"
            columns: ["courseId"]
            isOneToOne: false
            referencedRelation: "TrainingCourse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SubcontractorTraining_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      TeamMember: {
        Row: {
          avatar: string | null
          color: string | null
          createdAt: string | null
          defaultCommissionPct: number | null
          email: string | null
          id: string
          isActive: boolean | null
          name: string
          organizationId: string
          phone: string | null
          role: string | null
          updatedAt: string | null
        }
        Insert: {
          avatar?: string | null
          color?: string | null
          createdAt?: string | null
          defaultCommissionPct?: number | null
          email?: string | null
          id?: string
          isActive?: boolean | null
          name: string
          organizationId: string
          phone?: string | null
          role?: string | null
          updatedAt?: string | null
        }
        Update: {
          avatar?: string | null
          color?: string | null
          createdAt?: string | null
          defaultCommissionPct?: number | null
          email?: string | null
          id?: string
          isActive?: boolean | null
          name?: string
          organizationId?: string
          phone?: string | null
          role?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "TeamMember_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Todo: {
        Row: {
          completedAt: string | null
          createdAt: string | null
          dueDate: string | null
          id: string
          organizationId: string
          owner: string
          rockId: string | null
          status: string | null
          title: string
          updatedAt: string | null
        }
        Insert: {
          completedAt?: string | null
          createdAt?: string | null
          dueDate?: string | null
          id?: string
          organizationId: string
          owner: string
          rockId?: string | null
          status?: string | null
          title: string
          updatedAt?: string | null
        }
        Update: {
          completedAt?: string | null
          createdAt?: string | null
          dueDate?: string | null
          id?: string
          organizationId?: string
          owner?: string
          rockId?: string | null
          status?: string | null
          title?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Todo_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Todo_rockId_fkey"
            columns: ["rockId"]
            isOneToOne: false
            referencedRelation: "Rock"
            referencedColumns: ["id"]
          },
        ]
      }
      TrainingCourse: {
        Row: {
          courseType: string | null
          coverImage: string | null
          createdAt: string | null
          description: string | null
          id: string
          isPublished: boolean | null
          order: number | null
          organizationId: string
          targetAudience: string | null
          title: string
          updatedAt: string | null
        }
        Insert: {
          courseType?: string | null
          coverImage?: string | null
          createdAt?: string | null
          description?: string | null
          id?: string
          isPublished?: boolean | null
          order?: number | null
          organizationId: string
          targetAudience?: string | null
          title: string
          updatedAt?: string | null
        }
        Update: {
          courseType?: string | null
          coverImage?: string | null
          createdAt?: string | null
          description?: string | null
          id?: string
          isPublished?: boolean | null
          order?: number | null
          organizationId?: string
          targetAudience?: string | null
          title?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "TrainingCourse_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          avatar: string | null
          createdAt: string | null
          email: string
          emailVerified: boolean | null
          ghlLinkedAt: string | null
          ghlLocationId: string | null
          ghlUserId: string | null
          id: string
          isActive: boolean | null
          lastLoginAt: string | null
          name: string
          passwordHash: string
          phone: string | null
          role: string | null
          updatedAt: string | null
        }
        Insert: {
          avatar?: string | null
          createdAt?: string | null
          email: string
          emailVerified?: boolean | null
          ghlLinkedAt?: string | null
          ghlLocationId?: string | null
          ghlUserId?: string | null
          id?: string
          isActive?: boolean | null
          lastLoginAt?: string | null
          name: string
          passwordHash: string
          phone?: string | null
          role?: string | null
          updatedAt?: string | null
        }
        Update: {
          avatar?: string | null
          createdAt?: string | null
          email?: string
          emailVerified?: boolean | null
          ghlLinkedAt?: string | null
          ghlLocationId?: string | null
          ghlUserId?: string | null
          id?: string
          isActive?: boolean | null
          lastLoginAt?: string | null
          name?: string
          passwordHash?: string
          phone?: string | null
          role?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      UserOrganization: {
        Row: {
          createdAt: string | null
          id: string
          isDefault: boolean | null
          organizationId: string
          role: string | null
          userId: string
        }
        Insert: {
          createdAt?: string | null
          id?: string
          isDefault?: boolean | null
          organizationId: string
          role?: string | null
          userId: string
        }
        Update: {
          createdAt?: string | null
          id?: string
          isDefault?: boolean | null
          organizationId?: string
          role?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserOrganization_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UserOrganization_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      VTO: {
        Row: {
          annualTarget: number | null
          coreFocus: Json | null
          coreValues: Json | null
          createdAt: string | null
          formulaParams: Json | null
          id: string
          issuesList: Json | null
          oneYearGoals: Json | null
          oneYearPlan: Json | null
          oneYearVision: string | null
          organizationId: string
          quarterlyRocks: Json | null
          tenYearTarget: string | null
          threeYearPicture: Json | null
          updatedAt: string | null
        }
        Insert: {
          annualTarget?: number | null
          coreFocus?: Json | null
          coreValues?: Json | null
          createdAt?: string | null
          formulaParams?: Json | null
          id?: string
          issuesList?: Json | null
          oneYearGoals?: Json | null
          oneYearPlan?: Json | null
          oneYearVision?: string | null
          organizationId: string
          quarterlyRocks?: Json | null
          tenYearTarget?: string | null
          threeYearPicture?: Json | null
          updatedAt?: string | null
        }
        Update: {
          annualTarget?: number | null
          coreFocus?: Json | null
          coreValues?: Json | null
          createdAt?: string | null
          formulaParams?: Json | null
          id?: string
          issuesList?: Json | null
          oneYearGoals?: Json | null
          oneYearPlan?: Json | null
          oneYearVision?: string | null
          organizationId?: string
          quarterlyRocks?: Json | null
          tenYearTarget?: string | null
          threeYearPicture?: Json | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "VTO_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: true
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      WeeklySales: {
        Row: {
          channels: Json | null
          createdAt: string | null
          estimates: number | null
          id: string
          leads: number | null
          notes: string | null
          organizationId: string
          revenue: number | null
          sales: number | null
          updatedAt: string | null
          weekStart: string
        }
        Insert: {
          channels?: Json | null
          createdAt?: string | null
          estimates?: number | null
          id?: string
          leads?: number | null
          notes?: string | null
          organizationId: string
          revenue?: number | null
          sales?: number | null
          updatedAt?: string | null
          weekStart: string
        }
        Update: {
          channels?: Json | null
          createdAt?: string | null
          estimates?: number | null
          id?: string
          leads?: number | null
          notes?: string | null
          organizationId?: string
          revenue?: number | null
          sales?: number | null
          updatedAt?: string | null
          weekStart?: string
        }
        Relationships: [
          {
            foreignKeyName: "WeeklySales_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      WorkOrder: {
        Row: {
          actualEndDate: string | null
          actualStartDate: string | null
          comments: Json | null
          createdAt: string
          estimatedDuration: number | null
          id: string
          jobId: string
          materials: Json | null
          organizationId: string
          osNumber: string
          photos: Json | null
          publicToken: string
          rooms: Json | null
          scheduledDate: string | null
          status: string
          subcontractorPrice: number | null
          tasks: Json | null
          updatedAt: string
        }
        Insert: {
          actualEndDate?: string | null
          actualStartDate?: string | null
          comments?: Json | null
          createdAt?: string
          estimatedDuration?: number | null
          id?: string
          jobId: string
          materials?: Json | null
          organizationId: string
          osNumber: string
          photos?: Json | null
          publicToken: string
          rooms?: Json | null
          scheduledDate?: string | null
          status?: string
          subcontractorPrice?: number | null
          tasks?: Json | null
          updatedAt?: string
        }
        Update: {
          actualEndDate?: string | null
          actualStartDate?: string | null
          comments?: Json | null
          createdAt?: string
          estimatedDuration?: number | null
          id?: string
          jobId?: string
          materials?: Json | null
          organizationId?: string
          osNumber?: string
          photos?: Json | null
          publicToken?: string
          rooms?: Json | null
          scheduledDate?: string | null
          status?: string
          subcontractorPrice?: number | null
          tasks?: Json | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "WorkOrder_jobId_fkey"
            columns: ["jobId"]
            isOneToOne: false
            referencedRelation: "Job"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WorkOrder_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_org_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
