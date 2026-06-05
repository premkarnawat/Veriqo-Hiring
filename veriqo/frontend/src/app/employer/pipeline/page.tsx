'use client'

import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ShieldCheck, Users, ChevronDown, Award, Clock, CheckCircle2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, getInitials, getScoreColor } from '@/lib/utils'

const STAGES = [
  { id: 'applied',            label: 'Applied',             color: 'border-t-muted-foreground', count_color: 'bg-muted text-muted-foreground' },
  { id: 'ats_matched',        label: 'ATS Matched',         color: 'border-t-primary',           count_color: 'bg-primary/10 text-primary-400' },
  { id: 'interest_confirmed', label: 'Interest Confirmed',  color: 'border-t-cyan-500',          count_color: 'bg-cyan/10 text-cyan-400' },
  { id: 'expert_review',      label: 'Expert Review',       color: 'border-t-indigo-500',        count_color: 'bg-indigo/10 text-indigo-400' },
  { id: 'shortlisted',        label: 'Shortlisted',         color: 'border-t-trust-500',         count_color: 'bg-trust-500/10 text-trust-400' },
  { id: 'interview_scheduled',label: 'Interview',           color: 'border-t-amber-500',         count_color: 'bg-amber-500/10 text-amber-400' },
]

const MOCK_PIPELINE: Record<string, Array<{
  id: string; name: string; role: string; score: number; risk: string; applied_at: string
}>> = {
  applied: [
    { id: '1', name: 'Vikram Nair',     role: 'React Developer', score: 71, risk: 'low',    applied_at: '2h ago' },
    { id: '2', name: 'Pooja Jain',      role: 'React Developer', score: 64, risk: 'medium', applied_at: '5h ago' },
    { id: '3', name: 'Suresh Kumar',    role: 'React Developer', score: 58, risk: 'low',    applied_at: '1d ago' },
  ],
  ats_matched: [
    { id: '4', name: 'Arjun Sharma',    role: 'React Developer', score: 94, risk: 'low',    applied_at: '3d ago' },
    { id: '5', name: 'Meera Pillai',    role: 'React Developer', score: 87, risk: 'low',    applied_at: '4d ago' },
  ],
  interest_confirmed: [
    { id: '6', name: 'Priya Menon',     role: 'React Developer', score: 88, risk: 'low',    applied_at: '5d ago' },
  ],
  expert_review: [
    { id: '7', name: 'Rahul Gupta',     role: 'React Developer', score: 81, risk: 'low',    applied_at: '6d ago' },
  ],
  shortlisted: [
    { id: '8', name: 'Neha Singh',      role: 'React Developer', score: 91, risk: 'low',    applied_at: '7d ago' },
    { id: '9', name: 'Amit Trivedi',    role: 'React Developer', score: 84, risk: 'low',    applied_at: '8d ago' },
  ],
  interview_scheduled: [
    { id: '10', name: 'Kavya Reddy',    role: 'React Developer', score: 96, risk: 'low',    applied_at: '9d ago' },
  ],
}

function CandidateCard({ candidate }: {
  candidate: { id: string; name: string; role: string; score: number; risk: string; applied_at: string }
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-card border border-border rounded-xl p-3 cursor-pointer hover:border-primary/30 hover:shadow-glow-sm transition-all duration-200"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="text-[10px]">{getInitials(candidate.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{candidate.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{candidate.role}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={cn('text-sm font-bold', getScoreColor(candidate.score))}>{candidate.score}</span>
        <Badge
          variant={candidate.risk === 'low' ? 'trust' : candidate.risk === 'medium' ? 'warning' : 'failed'}
          className="text-[9px] h-4 px-1.5"
        >
          {candidate.risk}
        </Badge>
        <span className="text-[10px] text-muted-foreground">{candidate.applied_at}</span>
      </div>
    </motion.div>
  )
}

export default function EmployerPipelinePage() {
  const ref    = useRef(null)
  const inView  = useInView(ref, { once: true })
  const [selectedJob, setSelectedJob] = useState('all')

  return (
    <div ref={ref} className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        className="flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold">Hiring Pipeline</h1>
          <p className="text-sm text-muted-foreground">Visual pipeline of all candidates across stages</p>
        </div>
        <Select value={selectedJob} onValueChange={setSelectedJob}>
          <SelectTrigger className="w-56 h-9">
            <SelectValue placeholder="All Jobs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            <SelectItem value="1">Senior React Developer</SelectItem>
            <SelectItem value="2">DevOps Engineer</SelectItem>
            <SelectItem value="3">Product Designer</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Pipeline stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 sm:grid-cols-6 gap-2"
      >
        {STAGES.map((stage) => {
          const count = (MOCK_PIPELINE[stage.id] || []).length
          return (
            <div key={stage.id} className="text-center p-2 rounded-lg border border-border bg-card">
              <p className="font-heading text-lg font-bold">{count}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{stage.label}</p>
            </div>
          )
        })}
      </motion.div>

      {/* Kanban board */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.15 }}
        className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide"
      >
        {STAGES.map((stage, si) => {
          const cards = MOCK_PIPELINE[stage.id] || []
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + si * 0.06 }}
              className="flex-shrink-0 w-56"
            >
              {/* Column header */}
              <div className={cn('rounded-t-xl border-t-2 bg-card border-x border-border px-3 py-2.5 mb-1', stage.color)}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">{stage.label}</p>
                  <span className={cn('text-[10px] font-bold rounded-full px-2 py-0.5', stage.count_color)}>
                    {cards.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-2 bg-muted/20 rounded-b-xl border border-t-0 border-border p-2 min-h-[200px]">
                {cards.length === 0 ? (
                  <div className="flex items-center justify-center h-20 text-[11px] text-muted-foreground">
                    No candidates
                  </div>
                ) : (
                  cards.map((c) => <CandidateCard key={c.id} candidate={c} />)
                )}
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
