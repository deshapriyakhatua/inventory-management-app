import FormField from "@/components/ui/FormField/FormField";
import Input from "@/components/ui/Input/Input";
import FormSection from "../FormSection/FormSection";
import styles from "./TimelineSection.module.css";

export default function TimelineSection({
  orderedOn,
  orderedOnError,
  onOrderedOnChange,
  onOrderedOnBlur,
  receivedOn,
  onReceivedOnChange,
}) {
  return (
    <FormSection icon="icon-f5ba4e77" title="Timeline">
      <div className={styles.root}>
        <FormField label="Ordered On" required error={orderedOnError}>
          <Input
            type="date"
            value={orderedOn}
            onChange={e => onOrderedOnChange(e.target.value)}
            onBlur={onOrderedOnBlur}
          />
        </FormField>

        <FormField label="Received On">
          <Input
            type="date"
            value={receivedOn}
            onChange={e => onReceivedOnChange(e.target.value)}
          />
        </FormField>
      </div>
    </FormSection>
  );
}
