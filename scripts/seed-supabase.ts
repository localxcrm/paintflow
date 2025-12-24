import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🌱 Seeding Supabase database...\n');

  try {
    // ============================================
    // ORGANIZATION
    // ============================================
    console.log('🏢 Creating organization...');
    const { data: org, error: orgError } = await supabase
      .from('Organization')
      .insert({
        id: 'org_demo_001',
        name: 'Demo Painting Co',
        slug: 'demo-painting',
        plan: 'pro'
      })
      .select()
      .single();

    if (orgError) throw orgError;
    const orgId = org.id;
    console.log(`✅ Organization created: ${orgId}\n`);

    // ============================================
    // BUSINESS SETTINGS
    // ============================================
    console.log('📊 Creating business settings...');
    const { error: settingsError } = await supabase
      .from('BusinessSettings')
      .insert({
        id: 'default-settings',
        organizationId: orgId,
        subPayoutPct: 60,
        subMaterialsPct: 15,
        subLaborPct: 45,
        minGrossProfitPerJob: 900,
        targetGrossMarginPct: 40,
        defaultDepositPct: 30,
        arTargetDays: 7,
        priceRoundingIncrement: 50,
      });

    if (settingsError) throw settingsError;
    console.log('✅ Business settings created\n');

    // ============================================
    // TEAM MEMBERS
    // ============================================
    console.log('👥 Creating team members...');
    const { data: teamMembers, error: teamError } = await supabase
      .from('TeamMember')
      .insert([
        {
          name: 'John Sales',
          email: 'john@paintpro.com',
          phone: '555-0101',
          role: 'sales',
          defaultCommissionPct: 5,
          isActive: true,
        },
        {
          name: 'Jane Manager',
          email: 'jane@paintpro.com',
          phone: '555-0102',
          role: 'pm',
          defaultCommissionPct: 3,
          isActive: true,
        },
        {
          name: 'Bob Both',
          email: 'bob@paintpro.com',
          phone: '555-0103',
          role: 'both',
          defaultCommissionPct: 5,
          isActive: true,
        },
      ])
      .select();

    if (teamError) throw teamError;
    console.log(`✅ Created ${teamMembers?.length} team members\n`);

    // ============================================
    // SUBCONTRACTORS
    // ============================================
    console.log('🔧 Creating subcontractors...');
    const { data: subs, error: subsError } = await supabase
      .from('Subcontractor')
      .insert([
        {
          name: 'Mike Painter',
          companyName: 'Pro Painters LLC',
          email: 'mike@propainters.com',
          phone: '555-0201',
          specialty: 'interior',
          defaultPayoutPct: 60,
          isActive: true,
        },
        {
          name: 'Sarah Exterior',
          companyName: 'Exterior Experts',
          email: 'sarah@exteriorexperts.com',
          phone: '555-0202',
          specialty: 'exterior',
          defaultPayoutPct: 65,
          isActive: true,
        },
        {
          name: 'Tom AllAround',
          companyName: 'Complete Paint Co',
          email: 'tom@completepaint.com',
          phone: '555-0203',
          specialty: 'both',
          defaultPayoutPct: 60,
          isActive: true,
        },
      ])
      .select();

    if (subsError) throw subsError;
    console.log(`✅ Created ${subs?.length} subcontractors\n`);

    // ============================================
    // PRICE BOOK - ROOM PRICES
    // ============================================
    console.log('💰 Creating room prices...');
    const rooms = [
      // Bedrooms
      { roomType: 'Bedroom', size: 'Small', typicalSqft: 100, wallsOnly: 350, wallsTrim: 450, wallsTrimCeiling: 550, fullRefresh: 650 },
      { roomType: 'Bedroom', size: 'Medium', typicalSqft: 150, wallsOnly: 450, wallsTrim: 550, wallsTrimCeiling: 700, fullRefresh: 850 },
      { roomType: 'Bedroom', size: 'Large', typicalSqft: 200, wallsOnly: 550, wallsTrim: 700, wallsTrimCeiling: 900, fullRefresh: 1100 },
      { roomType: 'Bedroom', size: 'Master', typicalSqft: 250, wallsOnly: 650, wallsTrim: 850, wallsTrimCeiling: 1100, fullRefresh: 1350 },

      // Bathrooms
      { roomType: 'Bathroom', size: 'Small', typicalSqft: 50, wallsOnly: 250, wallsTrim: 350, wallsTrimCeiling: 450, fullRefresh: 550 },
      { roomType: 'Bathroom', size: 'Medium', typicalSqft: 75, wallsOnly: 350, wallsTrim: 450, wallsTrimCeiling: 600, fullRefresh: 750 },
      { roomType: 'Bathroom', size: 'Large', typicalSqft: 100, wallsOnly: 450, wallsTrim: 600, wallsTrimCeiling: 800, fullRefresh: 1000 },
      { roomType: 'Bathroom', size: 'Master', typicalSqft: 150, wallsOnly: 600, wallsTrim: 800, wallsTrimCeiling: 1050, fullRefresh: 1300 },

      // Kitchen
      { roomType: 'Kitchen', size: 'Small', typicalSqft: 100, wallsOnly: 500, wallsTrim: 650, wallsTrimCeiling: 850, fullRefresh: 1050 },
      { roomType: 'Kitchen', size: 'Medium', typicalSqft: 150, wallsOnly: 700, wallsTrim: 900, wallsTrimCeiling: 1150, fullRefresh: 1400 },
      { roomType: 'Kitchen', size: 'Large', typicalSqft: 200, wallsOnly: 900, wallsTrim: 1150, wallsTrimCeiling: 1500, fullRefresh: 1850 },

      // Living Areas
      { roomType: 'Living Room', size: 'Small', typicalSqft: 150, wallsOnly: 550, wallsTrim: 750, wallsTrimCeiling: 950, fullRefresh: 1150 },
      { roomType: 'Living Room', size: 'Medium', typicalSqft: 200, wallsOnly: 750, wallsTrim: 950, wallsTrimCeiling: 1200, fullRefresh: 1450 },
      { roomType: 'Living Room', size: 'Large', typicalSqft: 300, wallsOnly: 1050, wallsTrim: 1350, wallsTrimCeiling: 1700, fullRefresh: 2100 },

      // Dining Room
      { roomType: 'Dining Room', size: 'Small', typicalSqft: 100, wallsOnly: 450, wallsTrim: 600, wallsTrimCeiling: 750, fullRefresh: 950 },
      { roomType: 'Dining Room', size: 'Medium', typicalSqft: 150, wallsOnly: 600, wallsTrim: 800, wallsTrimCeiling: 1000, fullRefresh: 1250 },
      { roomType: 'Dining Room', size: 'Large', typicalSqft: 200, wallsOnly: 800, wallsTrim: 1050, wallsTrimCeiling: 1300, fullRefresh: 1600 },

      // Other
      { roomType: 'Office', size: 'Small', typicalSqft: 100, wallsOnly: 400, wallsTrim: 550, wallsTrimCeiling: 700, fullRefresh: 850 },
      { roomType: 'Office', size: 'Medium', typicalSqft: 150, wallsOnly: 550, wallsTrim: 750, wallsTrimCeiling: 950, fullRefresh: 1150 },
      { roomType: 'Hallway', size: 'Small', typicalSqft: 50, wallsOnly: 200, wallsTrim: 300, wallsTrimCeiling: 400, fullRefresh: 500 },
      { roomType: 'Hallway', size: 'Medium', typicalSqft: 100, wallsOnly: 350, wallsTrim: 500, wallsTrimCeiling: 650, fullRefresh: 800 },
      { roomType: 'Laundry Room', size: 'Small', typicalSqft: 50, wallsOnly: 250, wallsTrim: 350, wallsTrimCeiling: 450, fullRefresh: 550 },
      { roomType: 'Garage', size: 'Single', typicalSqft: 250, wallsOnly: 600, wallsTrim: 800, wallsTrimCeiling: 1000, fullRefresh: 1250 },
      { roomType: 'Garage', size: 'Double', typicalSqft: 450, wallsOnly: 950, wallsTrim: 1250, wallsTrimCeiling: 1600, fullRefresh: 2000 },
    ];

    const { error: roomsError } = await supabase.from('RoomPrice').insert(rooms);
    if (roomsError) throw roomsError;
    console.log(`✅ Created ${rooms.length} room prices\n`);

    // ============================================
    // PRICE BOOK - EXTERIOR PRICES
    // ============================================
    console.log('🏠 Creating exterior prices...');
    const exteriorPrices = [
      { surfaceType: 'Wood Siding', pricePerSqft: 3.50, prepMultiplier: 1.2 },
      { surfaceType: 'Stucco', pricePerSqft: 3.00, prepMultiplier: 1.0 },
      { surfaceType: 'Brick', pricePerSqft: 4.00, prepMultiplier: 1.1 },
      { surfaceType: 'Vinyl Siding', pricePerSqft: 2.50, prepMultiplier: 0.9 },
      { surfaceType: 'Fiber Cement', pricePerSqft: 3.75, prepMultiplier: 1.15 },
      { surfaceType: 'Metal Siding', pricePerSqft: 3.25, prepMultiplier: 1.0 },
      { surfaceType: 'Trim/Fascia', pricePerSqft: 4.50, prepMultiplier: 1.3 },
      { surfaceType: 'Deck/Fence', pricePerSqft: 3.00, prepMultiplier: 1.4 },
    ];

    const { error: exteriorError } = await supabase.from('ExteriorPrice').insert(exteriorPrices);
    if (exteriorError) throw exteriorError;
    console.log(`✅ Created ${exteriorPrices.length} exterior prices\n`);

    // ============================================
    // PRICE BOOK - ADDONS
    // ============================================
    console.log('➕ Creating add-ons...');
    const addons = [
      { name: 'Wallpaper Removal', category: 'interior', unit: 'per_room', basePrice: 200 },
      { name: 'Popcorn Ceiling Removal', category: 'interior', unit: 'per_100_sqft', basePrice: 150 },
      { name: 'Drywall Repair - Minor', category: 'interior', unit: 'each', basePrice: 75 },
      { name: 'Drywall Repair - Major', category: 'interior', unit: 'each', basePrice: 250 },
      { name: 'Caulking/Sealing', category: 'both', unit: 'linear_ft', basePrice: 2 },
      { name: 'Primer Coat', category: 'both', unit: 'per_room', basePrice: 100 },
      { name: 'Pressure Washing', category: 'exterior', unit: 'per_100_sqft', basePrice: 50 },
      { name: 'Mildew Treatment', category: 'exterior', unit: 'per_100_sqft', basePrice: 75 },
      { name: 'Wood Rot Repair', category: 'exterior', unit: 'each', basePrice: 300 },
      { name: 'Accent Wall - Special Finish', category: 'interior', unit: 'each', basePrice: 350 },
    ];

    const { error: addonsError } = await supabase.from('Addon').insert(addons);
    if (addonsError) throw addonsError;
    console.log(`✅ Created ${addons.length} add-ons\n`);

    // ============================================
    // COMPANY ESTIMATE SETTINGS
    // ============================================
    console.log('⚙️  Creating company estimate settings...');
    const { error: estSettingsError } = await supabase
      .from('CompanyEstimateSettings')
      .insert({
        id: 'default-estimate-settings',
        termsAndConditions: 'All work guaranteed for 2 years. 50% deposit required to start work. Final payment due upon completion.',
        paymentTerms: 'We accept cash, check, and all major credit cards. Net 15 days.',
        warrantyTerms: '2-year warranty on all labor and materials. Does not cover damage from external sources.',
      });

    if (estSettingsError) throw estSettingsError;
    console.log('✅ Company estimate settings created\n');

    // ============================================
    // SAMPLE LEADS
    // ============================================
    console.log('📋 Creating sample leads...');
    const leadDate1 = new Date();
    leadDate1.setDate(leadDate1.getDate() - 5);
    const leadDate2 = new Date();
    leadDate2.setDate(leadDate2.getDate() - 3);
    const leadDate3 = new Date();
    leadDate3.setDate(leadDate3.getDate() - 1);

    const leads = [
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        phone: '555-1001',
        address: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        source: 'Google',
        status: 'new',
        projectType: 'interior',
        leadDate: leadDate1.toISOString(),
        estimatedJobValue: 2500,
        notes: 'Interested in painting 3 bedrooms',
        assignedToId: teamMembers?.[0]?.id,
      },
      {
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@example.com',
        phone: '555-1002',
        address: '456 Oak Ave',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62702',
        source: 'Referral',
        status: 'contacted',
        projectType: 'exterior',
        leadDate: leadDate2.toISOString(),
        estimatedJobValue: 5000,
        notes: 'Needs exterior repaint, 2-story house',
        assignedToId: teamMembers?.[2]?.id,
      },
      {
        firstName: 'Carol',
        lastName: 'Davis',
        email: 'carol@example.com',
        phone: '555-1003',
        address: '789 Elm St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62703',
        source: 'Website',
        status: 'estimate_scheduled',
        projectType: 'both',
        leadDate: leadDate3.toISOString(),
        estimatedJobValue: 7500,
        notes: 'Full interior and exterior refresh',
        assignedToId: teamMembers?.[0]?.id,
      },
    ];

    const { data: createdLeads, error: leadsError } = await supabase.from('Lead').insert(leads).select();
    if (leadsError) throw leadsError;
    console.log(`✅ Created ${createdLeads?.length} sample leads\n`);

    // ============================================
    // VTO (Vision/Traction/Execution)
    // ============================================
    console.log('🎯 Creating VTO...');
    const { error: vtoError } = await supabase
      .from('VTO')
      .insert({
        id: 'default-vto',
        coreValues: ['Integrity', 'Excellence', 'Customer First', 'Teamwork', 'Innovation'],
        coreFocusPurpose: 'Transform homes through superior painting craftsmanship',
        coreFocusNiche: 'Premium residential painting services',
        tenYearTarget: 'Be the #1 painting company in the tri-state area',
        threeYearRevenue: 2000000,
        threeYearProfit: 500000,
        threeYearPicture: '50+ projects per year, 15 team members, 3 service areas',
        oneYearRevenue: 750000,
        oneYearProfit: 180000,
        oneYearGoals: [
          'Increase revenue by 25%',
          'Hire 2 new team members',
          'Launch digital marketing campaign',
          'Achieve 4.8+ star rating',
        ],
        targetMarket: 'Homeowners earning $100K+, 2000-4000 sqft homes, 10-30 year old properties',
        threeUniques: [
          'Guaranteed 2-year warranty on all work',
          'Same-day estimates',
          'Zero-mess guarantee with professional prep',
        ],
        provenProcess: '1. Free Estimate 2. Color Consultation 3. Professional Prep 4. Quality Application 5. Final Inspection 6. 2-Year Warranty',
        guarantee: '100% satisfaction guaranteed or we will make it right at no additional cost',
        longTermIssues: ['Scaling operations', 'Finding quality painters', 'Marketing ROI'],
      });

    if (vtoError) throw vtoError;
    console.log('✅ VTO created\n');

    // ============================================
    // SAMPLE ROCKS (90-Day Goals)
    // ============================================
    console.log('🪨 Creating sample rocks...');
    const currentDate = new Date();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
    const currentYear = currentDate.getFullYear();
    const rockDueDate = new Date(currentYear, currentQuarter * 3, 0); // End of quarter

    const rocks = [
      {
        title: 'Launch new website',
        description: 'Redesign and launch company website with online booking',
        owner: 'Bob Both',
        rockType: 'company',
        quarter: currentQuarter,
        year: currentYear,
        status: 'on_track',
        dueDate: rockDueDate.toISOString(),
      },
      {
        title: 'Increase customer reviews',
        description: 'Get 50 new 5-star reviews on Google',
        owner: 'Jane Manager',
        rockType: 'company',
        quarter: currentQuarter,
        year: currentYear,
        status: 'on_track',
        dueDate: rockDueDate.toISOString(),
      },
      {
        title: 'Close $200K in sales',
        description: 'Personal quarterly sales goal',
        owner: 'John Sales',
        rockType: 'individual',
        quarter: currentQuarter,
        year: currentYear,
        status: 'on_track',
        dueDate: rockDueDate.toISOString(),
      },
    ];

    const { error: rocksError } = await supabase.from('Rock').insert(rocks);
    if (rocksError) throw rocksError;
    console.log(`✅ Created ${rocks.length} rocks\n`);

    // ============================================
    // SAMPLE SCORECARD METRICS
    // ============================================
    console.log('📊 Creating scorecard metrics...');
    const metrics = [
      {
        name: 'New Leads',
        owner: 'John Sales',
        goalValue: 20,
        goalType: 'number',
        goalDirection: 'above',
        category: 'leading',
      },
      {
        name: 'Estimates Created',
        owner: 'Bob Both',
        goalValue: 15,
        goalType: 'number',
        goalDirection: 'above',
        category: 'leading',
      },
      {
        name: 'Jobs Closed',
        owner: 'John Sales',
        goalValue: 10,
        goalType: 'number',
        goalDirection: 'above',
        category: 'leading',
      },
      {
        name: 'Weekly Revenue',
        owner: 'Jane Manager',
        goalValue: 15000,
        goalType: 'currency',
        goalDirection: 'above',
        category: 'lagging',
      },
      {
        name: 'Customer Satisfaction',
        owner: 'Bob Both',
        goalValue: 4.5,
        goalType: 'number',
        goalDirection: 'above',
        category: 'lagging',
      },
    ];

    const { error: metricsError } = await supabase.from('ScorecardMetric').insert(metrics);
    if (metricsError) throw metricsError;
    console.log(`✅ Created ${metrics.length} scorecard metrics\n`);

    console.log('✨ Seeding completed successfully!\n');
    console.log('📝 Summary:');
    console.log('   - Business settings configured');
    console.log('   - 3 team members created');
    console.log('   - 3 subcontractors created');
    console.log('   - 24 room prices created');
    console.log('   - 8 exterior prices created');
    console.log('   - 10 add-ons created');
    console.log('   - 3 sample leads created');
    console.log('   - VTO (Vision/Traction/Execution) created');
    console.log('   - 3 rocks (90-day goals) created');
    console.log('   - 5 scorecard metrics created');
    console.log('\n🎉 Database is ready to use!');

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
