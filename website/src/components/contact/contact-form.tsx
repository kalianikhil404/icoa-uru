"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "motion/react"
import { CheckCircle2, Loader2, Send } from "lucide-react"
import { contactSchema, type ContactInput } from "@/lib/schemas"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const TOPICS = {
  contact: ["A question about an order", "Sizing help", "Wholesale or markets", "Something else"],
  custom: ["Custom loom bracelet", "Name bracelet", "Matching set", "Event or bulk order"],
}

export function ContactForm({ mode = "contact" }: { mode?: "contact" | "custom" }) {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState("")
  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { type: mode, name: "", email: "", topic: TOPICS[mode][0], message: "", company: "" },
  })
  const { register, handleSubmit, control, formState } = form
  const err = formState.errors

  async function onSubmit(values: ContactInput) {
    setServerError("")
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, type: mode }),
    }).catch(() => null)
    if (res?.ok) setSent(true)
    else setServerError("Your message didn't send. Check your connection and try again, or email us directly.")
  }

  const field = "h-12 rounded-2xl bg-white/80 px-4"

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center rounded-[28px] border bg-white/70 p-10 text-center"
        >
          <CheckCircle2 className="size-10 text-lagoon" />
          <p className="mt-4 font-display text-2xl text-cocoa">Message sent</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Thank you! A reply will land in your inbox soon. Keep an eye on your spam folder just in case.
          </p>
        </motion.div>
      ) : (
        <motion.form key="form" exit={{ opacity: 0 }} onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${mode}-name`}>Name</Label>
            <Input id={`${mode}-name`} autoComplete="name" className={field} aria-invalid={!!err.name} {...register("name")} />
            {err.name && <p className="text-xs text-destructive">{err.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${mode}-email`}>Email</Label>
            <Input id={`${mode}-email`} type="email" autoComplete="email" className={field} aria-invalid={!!err.email} {...register("email")} />
            {err.email && <p className="text-xs text-destructive">{err.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>{mode === "custom" ? "What would you like?" : "Topic"}</Label>
            <Controller
              control={control}
              name="topic"
              render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger className="h-12 w-full rounded-2xl bg-white/80 px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {TOPICS[mode].map((t) => (
                      <SelectItem key={t} value={t} className="rounded-xl">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            {mode === "custom" ? (
              <>
                <Label htmlFor="deadline">Needed by (optional)</Label>
                <Input id="deadline" type="date" className={field} {...register("deadline")} />
              </>
            ) : (
              <>
                <Label htmlFor="order">Order number (optional)</Label>
                <Input id="order" placeholder="IU-…" className={field} {...register("orderNumber")} />
              </>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${mode}-message`}>{mode === "custom" ? "Tell us your idea" : "Message"}</Label>
            <Textarea
              id={`${mode}-message`}
              rows={5}
              className="rounded-2xl bg-white/80 p-4"
              placeholder={mode === "custom" ? "Colours, motifs, a name, the occasion…" : undefined}
              aria-invalid={!!err.message}
              {...register("message")}
            />
            {err.message && <p className="text-xs text-destructive">{err.message.message}</p>}
          </div>
          {/* spam trap, hidden from people */}
          <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden {...register("company")} />
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <p className={cn("text-sm", serverError ? "text-destructive" : "text-muted-foreground")}>
              {serverError || "Replies usually within 1–2 days."}
            </p>
            <button
              type="submit"
              disabled={formState.isSubmitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-lagoon px-7 text-[0.95rem] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-lagoon-deep disabled:opacity-60"
            >
              {formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {mode === "custom" ? "Send my idea" : "Send message"}
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
