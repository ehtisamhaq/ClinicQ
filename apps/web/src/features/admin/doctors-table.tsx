"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconStethoscope,
  IconEdit,
  IconCalendar,
  IconClock,
  IconSearch,
  IconCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DoctorCatalogItem } from "@/lib/catalog/queries";
import { updateDoctorProfileAction } from "@/lib/admin/actions";

interface DoctorsTableProps {
  doctors: DoctorCatalogItem[];
}

export function DoctorsTable({ doctors }: DoctorsTableProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [editingDoctor, setEditingDoctor] = React.useState<DoctorCatalogItem | null>(null);

  // Form states
  const [specialty, setSpecialty] = React.useState("");
  const [fee, setFee] = React.useState<number>(1000);
  const [avgMinutes, setAvgMinutes] = React.useState<number>(15);
  const [bio, setBio] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  const filteredDoctors = React.useMemo(() => {
    if (!search.trim()) return doctors;
    const q = search.toLowerCase();
    return doctors.filter(
      (d) =>
        (d.name || "").toLowerCase().includes(q) ||
        (d.specialty || "").toLowerCase().includes(q) ||
        (d.languages && d.languages.some((l) => l.toLowerCase().includes(q)))
    );
  }, [doctors, search]);

  const openEditModal = (doc: DoctorCatalogItem) => {
    setEditingDoctor(doc);
    setSpecialty(doc.specialty);
    setFee(doc.consultationFee);
    setAvgMinutes(doc.experienceYears || 15);
    setBio(doc.bio || "");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    startTransition(async () => {
      const res = await updateDoctorProfileAction({
        doctorId: editingDoctor.id,
        specialty,
        consultationFee: fee,
        avgConsultMinutes: avgMinutes,
        bio: bio || undefined,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to update doctor profile");
        return;
      }

      toast.success("Doctor profile updated successfully!");
      setEditingDoctor(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search doctors by name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <Button
          render={<Link href="/schedules" />}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
        >
          <IconCalendar className="h-4 w-4" />
          Configure Weekly Schedules
        </Button>
      </div>

      {/* Main Table */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Consultation Fee</TableHead>
                <TableHead>Languages</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-8 text-xs text-muted-foreground">
                    No doctors found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDoctors.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                          <IconStethoscope className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-foreground">
                            {doc.name?.startsWith("Dr.") ? doc.name : `Dr. ${doc.name || "Doctor"}`}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            ID: {doc.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-xs font-medium">
                        {doc.specialty}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-xs text-foreground">
                        ৳{doc.consultationFee}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        {doc.languages.map((lang) => (
                          <Badge key={lang} variant="secondary" className="text-[10px] uppercase">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(doc)}
                          className="h-7 text-xs px-2.5 gap-1"
                        >
                          <IconEdit className="h-3 w-3" />
                          Edit Profile
                        </Button>
                        <Button
                          render={<Link href={`/schedules?doctorId=${doc.id}`} />}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2.5 gap-1 text-primary"
                        >
                          <IconClock className="h-3 w-3" />
                          Schedule
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Doctor Dialog */}
      <Dialog open={!!editingDoctor} onOpenChange={(open) => !open && setEditingDoctor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconEdit className="h-5 w-5 text-primary" />
              Edit Doctor Profile
            </DialogTitle>
            <DialogDescription>
              Update clinical specialty and fee for Dr. {editingDoctor?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="specialty" className="text-xs">Specialty *</Label>
              <Input
                id="specialty"
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fee" className="text-xs">Consultation Fee (৳) *</Label>
                <Input
                  id="fee"
                  type="number"
                  min={100}
                  step={50}
                  required
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="avgMinutes" className="text-xs">Baseline Minutes *</Label>
                <Input
                  id="avgMinutes"
                  type="number"
                  min={5}
                  max={60}
                  required
                  value={avgMinutes}
                  onChange={(e) => setAvgMinutes(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs">Doctor Bio & Qualifications</Label>
              <Input
                id="bio"
                placeholder="e.g., MBBS, FCPS (Cardiology), 10+ yrs experience"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingDoctor(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="gap-1.5 font-semibold">
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
