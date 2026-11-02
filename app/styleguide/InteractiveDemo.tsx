"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";

export function InteractiveDemo() {
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button>Start teaching</Button>
        <Button variant="secondary">Watch demo</Button>
        <Button variant="ghost">Fix this gap</Button>
        <Button variant="dark">Finish session</Button>
        <Button loading>Saving</Button>
        <Button disabled>Opens in 04:59</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
      <Tabs
        label="Subjects"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "all", label: "All" },
          { value: "science", label: "Science" },
          { value: "cs", label: "Computer science" },
          { value: "history", label: "History" },
        ]}
      />
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Please verify you're human">
        <p className="text-ink-2">We saw unusual activity from this browser. Confirm to keep going.</p>
        <Button className="mt-6" fullWidth onClick={() => setOpen(false)}>
          I&apos;m human
        </Button>
      </Modal>
    </div>
  );
}
