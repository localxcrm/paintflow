'use client';

import { useState } from 'react';
import { mockRoomPrices, mockExteriorPrices, mockAddons } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Edit,
  Home,
  Building,
  Layers,
} from 'lucide-react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

function InteriorPriceBook() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = mockRoomPrices.filter((room) =>
    room.roomType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by room type
  const roomTypes = [...new Set(filteredRooms.map((r) => r.roomType))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Room Type
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Typical SF</TableHead>
              <TableHead className="text-right">Walls Only</TableHead>
              <TableHead className="text-right">+ Trim</TableHead>
              <TableHead className="text-right">+ Ceiling</TableHead>
              <TableHead className="text-right">Full Refresh</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roomTypes.map((roomType) => {
              const rooms = filteredRooms.filter((r) => r.roomType === roomType);
              return rooms.map((room, index) => (
                <TableRow key={room.id}>
                  {index === 0 && (
                    <TableCell
                      className="font-medium bg-slate-50"
                      rowSpan={rooms.length}
                    >
                      {room.roomType}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline">{room.size}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{room.typicalSqft} SF</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(room.wallsOnly)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(room.wallsTrim)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(room.wallsTrimCeiling)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(room.fullRefresh)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ));
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ExteriorPriceBook() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Surface Type
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Surface Type</TableHead>
              <TableHead className="text-right">Price/SF</TableHead>
              <TableHead className="text-right">Prep Multiplier</TableHead>
              <TableHead className="text-right">Effective Rate</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockExteriorPrices.map((surface) => (
              <TableRow key={surface.id}>
                <TableCell className="font-medium">{surface.surfaceType}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(surface.pricePerSqft)}/SF
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={surface.prepMultiplier > 1 ? 'secondary' : 'outline'}>
                    {surface.prepMultiplier}x
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(surface.pricePerSqft * surface.prepMultiplier)}/SF
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AddonsPriceBook() {
  const [filter, setFilter] = useState<'all' | 'interior' | 'exterior'>('all');

  const filteredAddons = mockAddons.filter(
    (addon) => filter === 'all' || addon.category === filter || addon.category === 'both'
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="interior">Interior</TabsTrigger>
            <TabsTrigger value="exterior">Exterior</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Add-on
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAddons.map((addon) => (
          <Card key={addon.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-slate-900">{addon.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {addon.category}
                    </Badge>
                    <span className="text-sm text-slate-500">per {addon.unit}</span>
                  </div>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(addon.basePrice)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function PriceBookPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Price Book</h1>
        <p className="text-slate-500">Manage your pricing for rooms, surfaces, and add-ons</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Home className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Interior Rooms</p>
              <p className="text-2xl font-bold">{mockRoomPrices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Building className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Exterior Surfaces</p>
              <p className="text-2xl font-bold">{mockExteriorPrices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Layers className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Add-ons</p>
              <p className="text-2xl font-bold">{mockAddons.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="interior" className="space-y-4">
        <TabsList>
          <TabsTrigger value="interior" className="gap-2">
            <Home className="h-4 w-4" />
            Interior
          </TabsTrigger>
          <TabsTrigger value="exterior" className="gap-2">
            <Building className="h-4 w-4" />
            Exterior
          </TabsTrigger>
          <TabsTrigger value="addons" className="gap-2">
            <Layers className="h-4 w-4" />
            Add-ons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interior">
          <InteriorPriceBook />
        </TabsContent>

        <TabsContent value="exterior">
          <ExteriorPriceBook />
        </TabsContent>

        <TabsContent value="addons">
          <AddonsPriceBook />
        </TabsContent>
      </Tabs>
    </div>
  );
}
