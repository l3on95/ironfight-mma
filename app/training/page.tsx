import PageHeader from "@/components/PageHeader";
import { TRAINING_PLANS } from "@/lib/training-plans";
import Link from "next/link";

export default function TrainingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Trainingspläne"
        title="Wähle deine Disziplin"
        description="Strukturierte, progressive Pläne für jede MMA-Disziplin. Stelle dir deinen Fight-Camp aus den Bausteinen zusammen."
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {TRAINING_PLANS.map((plan) => {
            const sessions = plan.blocks.reduce(
              (sum, b) => sum + b.exercises.length,
              0,
            );
            return (
              <Link
                key={plan.slug}
                href={`/training/${plan.slug}`}
                className="group relative overflow-hidden rounded-sm border border-carbon-500 bg-carbon-700/60 p-8 transition-all hover:border-blood/60"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${plan.accent} to-transparent opacity-0 transition-opacity group-hover:opacity-100`}
                />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-blood">
                        {plan.level}
                      </div>
                      <h2 className="heading-display mt-2 text-3xl font-black">
                        {plan.name}
                      </h2>
                    </div>
                    <div className="rounded-sm border border-carbon-400 px-3 py-1 text-xs font-bold uppercase tracking-widest text-foreground/70">
                      {sessions} Übungen
                    </div>
                  </div>
                  <p className="mt-4 text-foreground/70">{plan.description}</p>
                  <div className="mt-6 inline-flex items-center text-sm font-bold uppercase tracking-wider text-foreground/70 group-hover:text-blood">
                    Plan ansehen →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
