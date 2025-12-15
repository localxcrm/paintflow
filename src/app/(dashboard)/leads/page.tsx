'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  ExternalLink,
  X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Simple contact interface for leads from API
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  source: string;
  createdAt: string;
  notes?: string;
}

// Mock data - in production this comes from API
const mockContacts: Contact[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '(203) 555-0101',
    address: '123 Oak Street',
    city: 'Greenwich',
    state: 'CT',
    zipCode: '06830',
    source: 'Website',
    createdAt: '2024-12-10T10:30:00Z',
    notes: 'Interested in interior painting for 3 bedrooms',
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@email.com',
    phone: '(203) 555-0102',
    address: '456 Maple Ave',
    city: 'Stamford',
    state: 'CT',
    zipCode: '06901',
    source: 'Referral',
    createdAt: '2024-12-09T14:15:00Z',
    notes: 'Kitchen cabinet refinishing',
  },
  {
    id: '3',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'mbrown@email.com',
    phone: '(203) 555-0103',
    address: '789 Pine Road',
    city: 'Westport',
    state: 'CT',
    zipCode: '06880',
    source: 'Google',
    createdAt: '2024-12-08T09:00:00Z',
    notes: 'Exterior painting - large colonial home',
  },
  {
    id: '4',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@email.com',
    phone: '(203) 555-0104',
    address: '321 Elm Street',
    city: 'Darien',
    state: 'CT',
    zipCode: '06820',
    source: 'Website',
    createdAt: '2024-12-07T16:45:00Z',
  },
  {
    id: '5',
    firstName: 'Robert',
    lastName: 'Wilson',
    email: 'rwilson@email.com',
    phone: '(203) 555-0105',
    address: '654 Birch Lane',
    city: 'New Canaan',
    state: 'CT',
    zipCode: '06840',
    source: 'Yelp',
    createdAt: '2024-12-06T11:20:00Z',
    notes: 'Full house repaint - moving in soon',
  },
  {
    id: '6',
    firstName: 'Jennifer',
    lastName: 'Martinez',
    email: 'jmartinez@email.com',
    phone: '(203) 555-0106',
    address: '987 Cedar Court',
    city: 'Norwalk',
    state: 'CT',
    zipCode: '06850',
    source: 'Referral',
    createdAt: '2024-12-05T13:30:00Z',
  },
  {
    id: '7',
    firstName: 'David',
    lastName: 'Anderson',
    email: 'david.a@email.com',
    phone: '(203) 555-0107',
    address: '246 Willow Way',
    city: 'Fairfield',
    state: 'CT',
    zipCode: '06824',
    source: 'Google',
    createdAt: '2024-12-04T10:00:00Z',
    notes: 'Deck staining project',
  },
  {
    id: '8',
    firstName: 'Lisa',
    lastName: 'Thompson',
    email: 'lisa.t@email.com',
    phone: '(203) 555-0108',
    address: '135 Spruce Drive',
    city: 'Ridgefield',
    state: 'CT',
    zipCode: '06877',
    source: 'Website',
    createdAt: '2024-12-03T15:10:00Z',
  },
];

const sourceColors: Record<string, string> = {
  Website: 'bg-blue-100 text-blue-800',
  Referral: 'bg-green-100 text-green-800',
  Google: 'bg-red-100 text-red-800',
  Yelp: 'bg-orange-100 text-orange-800',
};

const sourceOptions = ['Website', 'Referral', 'Google', 'Yelp', 'Facebook', 'Other'];

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Contact | null>(null);

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.firstName.toLowerCase().includes(searchLower) ||
      contact.lastName.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      contact.phone.includes(searchQuery) ||
      contact.city.toLowerCase().includes(searchLower)
    );
  });

  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact);
    setEditForm({ ...contact });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editForm) return;

    setContacts(contacts.map(c =>
      c.id === editForm.id ? editForm : c
    ));
    setIsModalOpen(false);
    setSelectedContact(null);
    setEditForm(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
    setEditForm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500">
            {contacts.length} contacts from API
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, phone, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contacts Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No contacts found
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => handleRowClick(contact)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {contact.city}, {contact.state}
                    </div>
                    <p className="text-xs text-slate-400">{contact.address}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={sourceColors[contact.source] || 'bg-slate-100 text-slate-800'}
                    >
                      {contact.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(contact.createdAt), 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-500 max-w-[200px] truncate">
                      {contact.notes || '-'}
                    </p>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        asChild
                      >
                        <a href={`tel:${contact.phone}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        asChild
                      >
                        <a href={`mailto:${contact.email}`}>
                          <Mail className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        asChild
                      >
                        <a href={`/estimates/new?contact=${contact.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Info about API */}
      <div className="text-center text-sm text-slate-400 py-4">
        Leads are synced automatically from your website and other sources via API
      </div>

      {/* Edit Lead Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Edit Lead
            </DialogTitle>
          </DialogHeader>

          {editForm && (
            <div className="space-y-4 py-2">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={editForm.zipCode}
                      onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Source and Notes side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="source">Lead Source</Label>
                  <Select
                    value={editForm.source}
                    onValueChange={(value) => setEditForm({ ...editForm, source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={2}
                    placeholder="Add notes..."
                  />
                </div>
              </div>

              {/* Date Added (read-only) */}
              <div className="text-xs text-slate-500">
                Added on {format(parseISO(editForm.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-between gap-2 pt-3 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${editForm.phone}`} className="gap-1">
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${editForm.email}`} className="gap-1">
                      <Mail className="h-4 w-4" />
                      Email
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/estimates/new?contact=${editForm.id}`} className="gap-1">
                      <ExternalLink className="h-4 w-4" />
                      Estimate
                    </a>
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
