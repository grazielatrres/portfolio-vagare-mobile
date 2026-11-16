import { FlightDetails, Info } from "@/services/infos";
import { Trip } from "@/services/trips";
import { formatDateShort } from "@/utils/format";
import { FlightForm } from "./FlightForm";
import { InfoCard } from "./InfoCard";

export interface FlightCardProps {
  info: Info;
  trip: Trip;
}

export function FlightCard({ info, trip }: FlightCardProps) {
  const details = (info.details ?? {}) as Partial<FlightDetails>;
  const routeParts = [details.origin, details.destination].filter(Boolean);
  const detailLine = [
    routeParts.length > 0 ? routeParts.join(" → ") : null,
    info.date ? formatDateShort(info.date) : null,
    details.time || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <InfoCard
      info={info}
      trip={trip}
      icon="airplane-outline"
      detailLines={[
        detailLine,
        details.flightNumber ? `Voo ${details.flightNumber}` : null,
      ]}
      deleteTexts={{
        errorTitle: "Não foi possível excluir o voo",
        confirmTitle: "Excluir voo?",
        confirmMessage: `${info.title} será removido das informações da viagem. Essa ação não pode ser desfeita.`,
      }}
      renderForm={(close) => (
        <FlightForm trip={trip} info={info} onCancel={close} onSuccess={close} />
      )}
    />
  );
}
