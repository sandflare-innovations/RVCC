type Application = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cvFileName: string;
  cvFileUrl: string;
  createdAt: string;
};

export function CareerApplicationsPanel({ applications }: { applications: Application[] }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="mb-3 text-xs font-bold tracking-[0.12em] text-zinc-600 uppercase">
        Applications ({applications.length})
      </h2>
      {applications.length === 0 ? (
        <p className="text-sm text-zinc-600">No applications yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {applications.map((app) => (
            <li key={app.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium text-zinc-950">{app.fullName}</p>
                <p className="text-sm text-zinc-600">
                  {app.email}
                  {app.phone ? ` · ${app.phone}` : ""}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {app.createdAt ? new Date(app.createdAt).toLocaleString("en-GB") : "—"}
                </p>
              </div>
              <a
                href={app.cvFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue shrink-0 text-sm font-semibold hover:underline"
              >
                {app.cvFileName || "Download CV"}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
