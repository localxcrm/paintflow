import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Business Settings
  console.log('Creating business settings...');
  await prisma.businessSettings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      subPayoutPct: 60,
      subMaterialsPct: 15,
      subLaborPct: 45,
      minGrossProfitPerJob: 900,
      targetGrossMarginPct: 40,
      defaultDepositPct: 30,
      arTargetDays: 7,
      priceRoundingIncrement: 50,
    },
  });

  // Create Company Estimate Settings
  console.log('Creating company estimate settings...');
  await prisma.companyEstimateSettings.upsert({
    where: { id: 'default-estimate-settings' },
    update: {},
    create: {
      id: 'default-estimate-settings',
      insuranceCompany: 'ABC Insurance Co.',
      insurancePolicyNumber: 'POL-123456',
      insuranceCoverageAmount: 1000000,
      insuranceExpirationDate: new Date('2025-12-31'),
      licenseNumber: 'LIC-789012',
      licenseState: 'CA',
      licenseExpirationDate: new Date('2025-06-30'),
      termsAndConditions: `1. Payment Terms: 30% deposit due upon acceptance, balance due upon completion.
2. Warranty: 2-year warranty on workmanship.
3. Materials: All materials are high-quality, name-brand paints.
4. Preparation: Includes light sanding, caulking, and priming as needed.
5. Clean-up: Daily clean-up and final walkthrough included.`,
      paymentTerms: 'Net 7 days from invoice date',
      warrantyTerms: '2-year warranty on all workmanship',
    },
  });

  // Create Team Members
  console.log('Creating team members...');
  const teamMembers = await Promise.all([
    prisma.teamMember.upsert({
      where: { email: 'john.owner@paintpro.com' },
      update: {},
      create: {
        name: 'John Owner',
        email: 'john.owner@paintpro.com',
        phone: '(555) 123-4567',
        role: 'both',
        defaultCommissionPct: 5,
        isActive: true,
      },
    }),
    prisma.teamMember.upsert({
      where: { email: 'sarah.sales@paintpro.com' },
      update: {},
      create: {
        name: 'Sarah Sales',
        email: 'sarah.sales@paintpro.com',
        phone: '(555) 234-5678',
        role: 'sales',
        defaultCommissionPct: 7,
        isActive: true,
      },
    }),
    prisma.teamMember.upsert({
      where: { email: 'mike.pm@paintpro.com' },
      update: {},
      create: {
        name: 'Mike Manager',
        email: 'mike.pm@paintpro.com',
        phone: '(555) 345-6789',
        role: 'pm',
        defaultCommissionPct: 5,
        isActive: true,
      },
    }),
  ]);

  // Create Subcontractors
  console.log('Creating subcontractors...');
  const subcontractors = await Promise.all([
    prisma.subcontractor.upsert({
      where: { email: 'carlos@interiorcrew.com' },
      update: {},
      create: {
        name: 'Carlos Rodriguez',
        companyName: 'Interior Crew LLC',
        email: 'carlos@interiorcrew.com',
        phone: '(555) 456-7890',
        specialty: 'interior',
        defaultPayoutPct: 60,
        isActive: true,
      },
    }),
    prisma.subcontractor.upsert({
      where: { email: 'david@exteriorpros.com' },
      update: {},
      create: {
        name: 'David Chen',
        companyName: 'Exterior Pros Inc',
        email: 'david@exteriorpros.com',
        phone: '(555) 567-8901',
        specialty: 'exterior',
        defaultPayoutPct: 55,
        isActive: true,
      },
    }),
    prisma.subcontractor.upsert({
      where: { email: 'alex@allpaint.com' },
      update: {},
      create: {
        name: 'Alex Johnson',
        companyName: 'All Paint Services',
        email: 'alex@allpaint.com',
        phone: '(555) 678-9012',
        specialty: 'both',
        defaultPayoutPct: 58,
        isActive: true,
      },
    }),
  ]);

  // Create Room Prices
  console.log('Creating room prices...');
  const roomTypes = [
    { type: 'Bedroom', sizes: { small: 150, medium: 225, large: 300 }, sqft: { small: 100, medium: 150, large: 200 } },
    { type: 'Bathroom', sizes: { small: 200, medium: 300, large: 400 }, sqft: { small: 40, medium: 60, large: 80 } },
    { type: 'Kitchen', sizes: { small: 350, medium: 500, large: 700 }, sqft: { small: 100, medium: 150, large: 200 } },
    { type: 'Living Room', sizes: { small: 300, medium: 450, large: 600 }, sqft: { small: 150, medium: 250, large: 350 } },
    { type: 'Dining Room', sizes: { small: 250, medium: 375, large: 500 }, sqft: { small: 100, medium: 150, large: 200 } },
    { type: 'Office', sizes: { small: 175, medium: 250, large: 350 }, sqft: { small: 100, medium: 150, large: 200 } },
    { type: 'Hallway', sizes: { small: 150, medium: 200, large: 275 }, sqft: { small: 50, medium: 100, large: 150 } },
    { type: 'Laundry Room', sizes: { small: 175, medium: 250, large: 325 }, sqft: { small: 50, medium: 75, large: 100 } },
  ];

  for (const room of roomTypes) {
    for (const size of ['small', 'medium', 'large'] as const) {
      const basePrice = room.sizes[size];
      await prisma.roomPrice.upsert({
        where: { roomType_size: { roomType: room.type, size } },
        update: {},
        create: {
          roomType: room.type,
          size,
          typicalSqft: room.sqft[size],
          wallsOnly: basePrice,
          wallsTrim: Math.round(basePrice * 1.35),
          wallsTrimCeiling: Math.round(basePrice * 1.65),
          fullRefresh: Math.round(basePrice * 2),
        },
      });
    }
  }

  // Create Exterior Prices
  console.log('Creating exterior prices...');
  const exteriorSurfaces = [
    { surface: 'Wood Siding', pricePerSqft: 2.5, prepMultiplier: 1.2 },
    { surface: 'Stucco', pricePerSqft: 2.0, prepMultiplier: 1.1 },
    { surface: 'Brick', pricePerSqft: 3.0, prepMultiplier: 1.3 },
    { surface: 'Vinyl Siding', pricePerSqft: 1.8, prepMultiplier: 1.0 },
    { surface: 'Aluminum Siding', pricePerSqft: 2.2, prepMultiplier: 1.1 },
    { surface: 'Trim/Fascia', pricePerSqft: 4.0, prepMultiplier: 1.2 },
    { surface: 'Doors', pricePerSqft: 5.0, prepMultiplier: 1.0 },
    { surface: 'Deck/Fence', pricePerSqft: 3.5, prepMultiplier: 1.4 },
  ];

  for (const surface of exteriorSurfaces) {
    await prisma.exteriorPrice.upsert({
      where: { surfaceType: surface.surface },
      update: {},
      create: {
        surfaceType: surface.surface,
        pricePerSqft: surface.pricePerSqft,
        prepMultiplier: surface.prepMultiplier,
      },
    });
  }

  // Create Addons
  console.log('Creating addons...');
  const addons = [
    { name: 'Wallpaper Removal', category: 'interior', unit: 'per room', price: 200 },
    { name: 'Texture Repair', category: 'interior', unit: 'per area', price: 150 },
    { name: 'Crown Molding Paint', category: 'interior', unit: 'per linear ft', price: 3 },
    { name: 'Cabinet Painting', category: 'interior', unit: 'per cabinet', price: 75 },
    { name: 'Door Painting', category: 'both', unit: 'per door', price: 50 },
    { name: 'Window Frame', category: 'both', unit: 'per window', price: 35 },
    { name: 'Pressure Washing', category: 'exterior', unit: 'per 100 sqft', price: 25 },
    { name: 'Caulking', category: 'both', unit: 'per linear ft', price: 2 },
    { name: 'Minor Drywall Repair', category: 'interior', unit: 'per patch', price: 50 },
    { name: 'Accent Wall', category: 'interior', unit: 'per wall', price: 100 },
  ];

  for (const addon of addons) {
    await prisma.addon.upsert({
      where: { name: addon.name },
      update: {},
      create: {
        name: addon.name,
        category: addon.category as 'interior' | 'exterior' | 'both',
        unit: addon.unit,
        basePrice: addon.price,
      },
    });
  }

  // Create VTO
  console.log('Creating VTO...');
  await prisma.vTO.upsert({
    where: { id: 'default-vto' },
    update: {},
    create: {
      id: 'default-vto',
      coreValues: ['Quality Craftsmanship', 'Customer First', 'Integrity', 'Team Excellence'],
      coreFocusPurpose: 'To transform spaces and exceed expectations',
      coreFocusNiche: 'Premium residential painting services',
      tenYearTarget: 'Become the #1 painting company in the region',
      threeYearRevenue: 1500000,
      threeYearProfit: 300000,
      threeYearPicture: 'Market leader with 15 employees and 3 crews',
      oneYearRevenue: 750000,
      oneYearProfit: 150000,
      oneYearGoals: ['Launch exterior services', 'Hire 2 new painters', 'Implement CRM system'],
      targetMarket: 'Homeowners in upper-middle class neighborhoods',
      threeUniques: ['5-year warranty', 'Same-day estimates', 'Eco-friendly paints'],
      provenProcess: 'Consult → Estimate → Schedule → Paint → Inspect → Follow-up',
      guarantee: '100% satisfaction or we repaint for free',
      longTermIssues: ['Finding skilled painters', 'Managing growth', 'Marketing consistency'],
    },
  });

  // Create Sample Leads
  console.log('Creating sample leads...');
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        firstName: 'Jennifer',
        lastName: 'Smith',
        email: 'jennifer.smith@email.com',
        phone: '(555) 111-2222',
        address: '123 Oak Street',
        city: 'Springfield',
        state: 'CA',
        zipCode: '90210',
        source: 'Website',
        status: 'new',
        projectType: 'interior',
        estimatedJobValue: 3500,
        notes: 'Interested in painting 3 bedrooms and hallway',
        assignedToId: teamMembers[1].id,
      },
    }),
    prisma.lead.create({
      data: {
        firstName: 'Michael',
        lastName: 'Johnson',
        email: 'mjohnson@email.com',
        phone: '(555) 333-4444',
        address: '456 Maple Ave',
        city: 'Springfield',
        state: 'CA',
        zipCode: '90211',
        source: 'Referral',
        status: 'contacted',
        projectType: 'exterior',
        estimatedJobValue: 8000,
        notes: 'Full exterior repaint, stucco home',
        assignedToId: teamMembers[1].id,
      },
    }),
    prisma.lead.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'swilliams@email.com',
        phone: '(555) 555-6666',
        address: '789 Pine Road',
        city: 'Springfield',
        state: 'CA',
        zipCode: '90212',
        source: 'Google Ads',
        status: 'estimate_scheduled',
        projectType: 'both',
        estimatedJobValue: 12000,
        notes: 'Complete interior and exterior, new construction',
        assignedToId: teamMembers[0].id,
      },
    }),
  ]);

  // Create Sample Estimates
  console.log('Creating sample estimates...');
  const estimate = await prisma.estimate.create({
    data: {
      estimateNumber: 'EST-1001',
      clientName: 'Jennifer Smith',
      address: '123 Oak Street, Springfield, CA 90210',
      status: 'sent',
      estimateDate: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 3750,
      discountAmount: 0,
      totalPrice: 3750,
      subMaterialsCost: 562.5,
      subLaborCost: 1687.5,
      subTotalCost: 2250,
      grossProfit: 1500,
      grossMarginPct: 40,
      meetsMinGp: true,
      meetsTargetGm: true,
      notes: 'Estimate for interior painting',
      leadId: leads[0].id,
      lineItems: {
        create: [
          {
            description: 'Medium Bedroom - Walls and Trim',
            location: 'Bedroom',
            scope: 'walls_trim',
            quantity: 3,
            unitPrice: 304,
            lineTotal: 912,
          },
          {
            description: 'Small Hallway - Walls and Trim',
            location: 'Hallway',
            scope: 'walls_trim',
            quantity: 1,
            unitPrice: 270,
            lineTotal: 270,
          },
          {
            description: 'Medium Living Room - Full Refresh',
            location: 'Living Room',
            scope: 'full_refresh',
            quantity: 1,
            unitPrice: 900,
            lineTotal: 900,
          },
        ],
      },
    },
  });

  // Create Sample Jobs
  console.log('Creating sample jobs...');
  await prisma.job.create({
    data: {
      jobNumber: 'JOB-1001',
      clientName: 'Robert Brown',
      address: '321 Elm Street',
      city: 'Springfield',
      projectType: 'interior',
      status: 'completed',
      jobDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      scheduledStartDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      scheduledEndDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      actualStartDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      actualEndDate: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
      jobValue: 4500,
      subMaterials: 675,
      subLabor: 2025,
      subTotal: 2700,
      grossProfit: 1800,
      grossMarginPct: 40,
      depositRequired: 1350,
      depositPaid: true,
      jobPaid: true,
      balanceDue: 0,
      invoiceDate: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
      paymentReceivedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      daysToCollect: 4,
      salesCommissionPct: 5,
      salesCommissionAmount: 225,
      salesCommissionPaid: true,
      pmCommissionPct: 5,
      pmCommissionAmount: 225,
      pmCommissionPaid: true,
      subcontractorPrice: 2700,
      subcontractorPaid: true,
      meetsMinGp: true,
      meetsTargetGm: true,
      profitFlag: 'OK',
      notes: 'Great job, customer very happy',
      salesRepId: teamMembers[1].id,
      projectManagerId: teamMembers[2].id,
      subcontractorId: subcontractors[0].id,
    },
  });

  // Create Scorecard Metrics
  console.log('Creating scorecard metrics...');
  const metrics = await Promise.all([
    prisma.scorecardMetric.create({
      data: {
        name: 'Leads Generated',
        owner: 'Sarah Sales',
        goalValue: 10,
        goalType: 'number',
        goalDirection: 'above',
        category: 'leading',
      },
    }),
    prisma.scorecardMetric.create({
      data: {
        name: 'Estimates Sent',
        owner: 'Sarah Sales',
        goalValue: 8,
        goalType: 'number',
        goalDirection: 'above',
        category: 'leading',
      },
    }),
    prisma.scorecardMetric.create({
      data: {
        name: 'Jobs Closed',
        owner: 'John Owner',
        goalValue: 4,
        goalType: 'number',
        goalDirection: 'above',
        category: 'lagging',
      },
    }),
    prisma.scorecardMetric.create({
      data: {
        name: 'Weekly Revenue',
        owner: 'John Owner',
        goalValue: 15000,
        goalType: 'currency',
        goalDirection: 'above',
        category: 'lagging',
      },
    }),
    prisma.scorecardMetric.create({
      data: {
        name: 'Gross Margin %',
        owner: 'John Owner',
        goalValue: 40,
        goalType: 'percent',
        goalDirection: 'above',
        category: 'lagging',
      },
    }),
  ]);

  // Add some scorecard entries
  const today = new Date();
  const weekEnding = new Date(today.setDate(today.getDate() - today.getDay()));

  for (let i = 0; i < 4; i++) {
    const entryDate = new Date(weekEnding);
    entryDate.setDate(entryDate.getDate() - i * 7);

    await Promise.all([
      prisma.scorecardEntry.create({
        data: {
          metricId: metrics[0].id,
          weekEndingDate: entryDate,
          actualValue: 8 + Math.floor(Math.random() * 6),
          onTrack: true,
        },
      }),
      prisma.scorecardEntry.create({
        data: {
          metricId: metrics[1].id,
          weekEndingDate: entryDate,
          actualValue: 6 + Math.floor(Math.random() * 5),
          onTrack: true,
        },
      }),
      prisma.scorecardEntry.create({
        data: {
          metricId: metrics[3].id,
          weekEndingDate: entryDate,
          actualValue: 12000 + Math.floor(Math.random() * 8000),
          onTrack: true,
        },
      }),
    ]);
  }

  // Create Rocks
  console.log('Creating rocks...');
  await Promise.all([
    prisma.rock.create({
      data: {
        title: 'Launch Exterior Services',
        description: 'Build out exterior painting capabilities with crew and equipment',
        owner: 'John Owner',
        rockType: 'company',
        quarter: 1,
        year: 2025,
        status: 'on_track',
        dueDate: new Date('2025-03-31'),
      },
    }),
    prisma.rock.create({
      data: {
        title: 'Hire 2 New Painters',
        description: 'Recruit and train two skilled painters for interior crew',
        owner: 'Mike Manager',
        rockType: 'individual',
        quarter: 1,
        year: 2025,
        status: 'on_track',
        dueDate: new Date('2025-03-31'),
      },
    }),
    prisma.rock.create({
      data: {
        title: 'Increase Lead Conversion to 35%',
        description: 'Improve sales process to close more estimates',
        owner: 'Sarah Sales',
        rockType: 'individual',
        quarter: 1,
        year: 2025,
        status: 'on_track',
        dueDate: new Date('2025-03-31'),
      },
    }),
  ]);

  // Create Todos
  console.log('Creating todos...');
  await Promise.all([
    prisma.todo.create({
      data: {
        title: 'Follow up with Jennifer Smith',
        owner: 'Sarah Sales',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'pending',
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Order paint supplies for next week',
        owner: 'Mike Manager',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'pending',
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Review Q4 financials',
        owner: 'John Owner',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
      },
    }),
  ]);

  // Create Issues
  console.log('Creating issues...');
  await Promise.all([
    prisma.issue.create({
      data: {
        title: 'Subcontractor availability',
        description: 'Need more reliable subs for busy season',
        issueType: 'short_term',
        priority: 1,
        status: 'open',
        createdBy: 'Mike Manager',
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Marketing spend ROI',
        description: 'Google Ads not converting as well as last quarter',
        issueType: 'short_term',
        priority: 2,
        status: 'in_discussion',
        createdBy: 'Sarah Sales',
      },
    }),
  ]);

  // Create Seats (Accountability Chart)
  console.log('Creating seats...');
  const ownerSeat = await prisma.seat.create({
    data: {
      seatName: 'Visionary/Integrator',
      roleDescription: 'Set company vision and manage day-to-day operations',
      responsibilities: ['Strategic planning', 'Financial oversight', 'Team leadership', 'Key client relationships'],
      personName: 'John Owner',
      gwcGetsIt: true,
      gwcWantsIt: true,
      gwcCapacity: true,
      isRightPersonRightSeat: true,
    },
  });

  await Promise.all([
    prisma.seat.create({
      data: {
        seatName: 'Sales Manager',
        roleDescription: 'Generate leads and close estimates',
        responsibilities: ['Lead generation', 'Estimate creation', 'Customer follow-up', 'Sales reporting'],
        personName: 'Sarah Sales',
        reportsToId: ownerSeat.id,
        gwcGetsIt: true,
        gwcWantsIt: true,
        gwcCapacity: true,
        isRightPersonRightSeat: true,
      },
    }),
    prisma.seat.create({
      data: {
        seatName: 'Operations Manager',
        roleDescription: 'Manage projects and subcontractors',
        responsibilities: ['Project scheduling', 'Quality control', 'Subcontractor management', 'Customer satisfaction'],
        personName: 'Mike Manager',
        reportsToId: ownerSeat.id,
        gwcGetsIt: true,
        gwcWantsIt: true,
        gwcCapacity: true,
        isRightPersonRightSeat: true,
      },
    }),
  ]);

  console.log('✅ Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
