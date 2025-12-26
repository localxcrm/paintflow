import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

interface TrainingModule {
  title: string;
  category: string;
  content: string;
  checklist: { id: string; text: string; checked: boolean }[];
  images: string[];
  videoUrl: string;
  order: number;
  isPublished: boolean;
}

// POST /api/sub-training/import - Import multiple training modules at once
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const modules: TrainingModule[] = body.modules;

    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return NextResponse.json(
        { error: 'Array of modules is required' },
        { status: 400 }
      );
    }

    // Get the current max order number
    const { data: lastModule } = await supabase
      .from('SubcontractorTraining')
      .select('order')
      .eq('organizationId', organizationId)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const startOrder = (lastModule?.order || 0) + 1;

    // Prepare modules for insertion
    const modulesToInsert = modules.map((module, index) => ({
      organizationId,
      title: module.title,
      category: module.category || 'producao',
      content: module.content || '',
      checklist: module.checklist || [],
      images: module.images || [],
      videoUrl: module.videoUrl || '',
      order: module.order ?? startOrder + index,
      isPublished: module.isPublished ?? false,
    }));

    const { data: insertedModules, error } = await supabase
      .from('SubcontractorTraining')
      .insert(modulesToInsert)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      count: insertedModules?.length || 0,
      modules: insertedModules,
    }, { status: 201 });
  } catch (error) {
    console.error('Error importing training modules:', error);
    return NextResponse.json(
      { error: 'Failed to import training modules' },
      { status: 500 }
    );
  }
}
