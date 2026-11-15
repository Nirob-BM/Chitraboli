import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Users, Search, Phone, Mail, MapPin, ShoppingBag, Ban, 
  CheckCircle, Loader2, RefreshCw, MessageSquare, Trash2,
  UserX, UserCheck, StickyNote, DollarSign, AlertTriangle
} from "lucide-react";
import { useCustomers, Customer, CustomerNote } from "@/hooks/useCustomers";
import { toast } from "sonner";

export const CustomerManagement = () => {
  const { 
    customers: allCustomers, 
    loading, 
    error: loadError,
    blockCustomer,
    unblockCustomer,
    deleteCustomer,
    addCustomerNote,
    getCustomerNotes,
    refetch 
  } = useCustomers();

  const [searchQuery, setSearchQuery] = useState("");
  
  const customers = allCustomers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name?.toLowerCase().includes(q) || 
           c.email?.toLowerCase().includes(q) || 
           c.phone?.includes(q);
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [customerToBlock, setCustomerToBlock] = useState<Customer | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const loadNotes = async (customer: Customer) => {
    setNotesLoading(true);
    setNotesError(null);
    const result = await getCustomerNotes(customer);
    if (result.success) setNotes(result.data);
    else setNotesError(result.error || "Notes could not be loaded");
    setNotesLoading(false);
  };

  useEffect(() => {
    setNotes([]);
    setNewNote("");
    if (selectedCustomer) void loadNotes(selectedCustomer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer?.id]);

  const handleBlock = async () => {
    if (!customerToBlock) return;
    setIsProcessing(true);
    
    const result = await blockCustomer(customerToBlock.id, blockReason);
    if (result.success) {
      toast.success(`${customerToBlock.name || 'Customer'} has been blocked`);
      setCustomerToBlock(null);
      setBlockReason("");
      if (selectedCustomer?.id === customerToBlock.id) {
        setSelectedCustomer(prev => prev ? { ...prev, is_blocked: true, block_reason: blockReason } : null);
      }
    } else {
      toast.error(`Failed to block customer: ${result.error || "unknown error"}`);
    }
    setIsProcessing(false);
  };

  const handleUnblock = async (customer: Customer) => {
    setIsProcessing(true);
    const result = await unblockCustomer(customer.id);
    if (result.success) {
      toast.success(`${customer.name || 'Customer'} has been unblocked`);
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(prev => prev ? { ...prev, is_blocked: false, block_reason: null } : null);
      }
    } else {
      toast.error(`Failed to unblock customer: ${result.error || "unknown error"}`);
    }
    setIsProcessing(false);
  };

  const handleAddNote = async () => {
    if (!selectedCustomer || !newNote.trim()) return;
    setIsAddingNote(true);
    
    const result = await addCustomerNote(selectedCustomer, newNote);
    if (result.success && result.data) {
      setNotes(prev => [result.data!, ...prev]);
      toast.success("Note saved");
      setNewNote("");
    } else {
      toast.error(`Failed to save note: ${result.error || "unknown error"}`);
    }
    setIsAddingNote(false);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    setIsProcessing(true);
    
    const result = await deleteCustomer(customerToDelete.id);
    if (result.success) {
      const r = result.result;
      toast.success(
        r
          ? `Customer data erased: ${r.orders_anonymized} order(s) anonymized, ${r.notes_deleted} note(s) and ${r.messages_deleted} message(s) deleted`
          : "Customer data erased"
      );
      setCustomerToDelete(null);
      setSelectedCustomer(null);
    } else {
      toast.error(`Failed to erase customer data: ${result.error || "unknown error"}`);
    }
    setIsProcessing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">Customer Management</h2>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? `${customers.length} of ${allCustomers.length} customers match`
                : `${allCustomers.length} customers total`}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search customers"
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 bg-card/80 border-border/50"
        />
      </div>

      {/* Customers Grid */}
      {loadError ? (
        <Card className="border-destructive/40" role="alert">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <AlertTriangle className="w-10 h-10 text-destructive" />
            <div>
              <h3 className="text-lg font-display text-foreground mb-1">Customers could not be loaded</h3>
              <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
            </div>
            <Button variant="outline" onClick={refetch} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Try again
            </Button>
          </CardContent>
        </Card>
      ) : customers.length === 0 ? (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-display text-foreground mb-2">No Customers Found</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery ? "Try adjusting your search query" : "Customer data will appear when orders are placed"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <Card 
              key={customer.id} 
              role="button"
              tabIndex={0}
              aria-label={`Open details for ${customer.name || customer.email || customer.phone || 'customer'}`}
              className={`bg-card/80 backdrop-blur-sm border-border/50 cursor-pointer hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
                customer.is_blocked ? 'border-l-4 border-l-destructive' : ''
              }`}
              onClick={() => setSelectedCustomer(customer)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedCustomer(customer); }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      customer.is_blocked ? 'bg-destructive/10' : 'bg-primary/10'
                    }`}>
                      {customer.is_blocked ? (
                        <UserX className="w-5 h-5 text-destructive" />
                      ) : (
                        <Users className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {customer.name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {customer.email || customer.phone}
                      </p>
                    </div>
                  </div>
                  {customer.is_blocked && (
                    <Badge variant="destructive" className="text-xs">Blocked</Badge>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShoppingBag className="w-4 h-4" />
                    <span>{customer.total_orders || 0} orders</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <DollarSign className="w-4 h-4" />
                    <span>৳{(customer.total_spent || 0).toLocaleString()}</span>
                  </div>
                </div>

                {customer.tags && customer.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {customer.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {customer.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{customer.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedCustomer?.is_blocked ? 'bg-destructive/10' : 'bg-primary/10'
              }`}>
                {selectedCustomer?.is_blocked ? (
                  <UserX className="w-5 h-5 text-destructive" />
                ) : (
                  <Users className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <span>{selectedCustomer?.name || 'Unknown Customer'}</span>
                {selectedCustomer?.is_blocked && (
                  <Badge variant="destructive" className="ml-2">Blocked</Badge>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              Customer since {selectedCustomer && formatDate(selectedCustomer.created_at)}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedCustomer?.email && (
                  <a href={`mailto:${selectedCustomer.email}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="text-sm truncate">{selectedCustomer.email}</span>
                  </a>
                )}
                {selectedCustomer?.phone && (
                  <a href={`tel:${selectedCustomer.phone}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="text-sm">{selectedCustomer.phone}</span>
                  </a>
                )}
                {selectedCustomer?.address && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 sm:col-span-2">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{selectedCustomer.address}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground">{selectedCustomer?.total_orders || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-green-500">৳{(selectedCustomer?.total_spent || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Block Reason */}
              {selectedCustomer?.is_blocked && selectedCustomer.block_reason && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive mb-1">Block Reason</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.block_reason}</p>
                </div>
              )}

              {/* Notes Section */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <StickyNote className="w-4 h-4" />
                  Customer Notes
                </h4>
                
                {/* Add Note */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note about this customer..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                    className="bg-background/50"
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || isAddingNote}
                    size="icon"
                    className="self-end h-10 w-10 shrink-0"
                    aria-label="Save note"
                  >
                    {isAddingNote ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                  </Button>
                </div>

              {notesLoading ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading notes…</p>
              ) : notesError ? (
                <div role="alert" className="flex items-center justify-between gap-3 p-3 rounded-lg border border-destructive/40 text-sm">
                  <span className="text-destructive">Notes could not be loaded.</span>
                  <Button size="sm" variant="outline" onClick={() => selectedCustomer && loadNotes(selectedCustomer)}>Try again</Button>
                </div>
              ) : notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                <ul className="space-y-2">
                  {notes.map((n) => (
                    <li key={n.id} className="p-3 rounded-lg bg-muted/30 text-sm">
                      <p className="whitespace-pre-wrap break-words text-foreground">{n.note}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(n.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                {selectedCustomer?.is_blocked ? (
                  <Button
                    variant="outline"
                    onClick={() => handleUnblock(selectedCustomer)}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    Unblock Customer
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setCustomerToBlock(selectedCustomer)}
                    className="gap-2 text-yellow-600 hover:text-yellow-600"
                  >
                    <Ban className="w-4 h-4" />
                    Block Customer
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => setCustomerToDelete(selectedCustomer)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Data (GDPR)
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Block Confirmation Dialog */}
      <AlertDialog open={!!customerToBlock} onOpenChange={() => setCustomerToBlock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block Customer</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent {customerToBlock?.name || 'this customer'} from placing orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for blocking (optional)"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            rows={2}
            className="my-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              disabled={isProcessing}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Block Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer Data</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently erases {customerToDelete?.name || 'this customer'}'s personal data: the customer record,
              notes and contact messages are deleted, and their name, email, phone and address are removed from past
              orders (order totals stay for your accounts). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
