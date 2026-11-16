import { Info, LodgingDetails } from "@/services/infos";
import { Trip } from "@/services/trips";
import { formatDateShort } from "@/utils/format";
import { InfoCard } from "./InfoCard";
import { LodgingForm } from "./LodgingForm";

export interface LodgingCardProps {
  info: Info;
  trip: Trip;
}

export function LodgingCard({ info, trip }: LodgingCardProps) {
  const details = (info.details ?? {}) as Partial<LodgingDetails>;
  const stayLine =
    details.checkIn && details.checkOut
      ? `${formatDateShort(details.checkIn)} – ${formatDateShort(details.checkOut)}`
      : null;

  return (
    <InfoCard
      info={info}
      trip={trip}
      icon="bed-outline"
      detailLines={[details.address, stayLine]}
      deleteTexts={{
        errorTitle: "Não foi possível excluir a hospedagem",
        confirmTitle: "Excluir hospedagem?",
        confirmMessage: `${info.title} será removida das informações da viagem. Essa ação não pode ser desfeita.`,
      }}
      renderForm={(close) => (
        <LodgingForm trip={trip} info={info} onCancel={close} onSuccess={close} />
      )}
    />
  );
}
