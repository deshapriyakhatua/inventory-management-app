import Card from "@/components/ui/Card/Card";
import Icon from "@/components/ui/Icon/Icon";
import styles from "./FormCard.module.css";

// Shared wrapper for the four form cards (header info, party details,
// line items, tax summary). Hidden by the page's @media print rules.
// `lead` renders above the title (PartyDetails' seller banner keeps its original position).
export default function FormCard({ icon, title, lead, children }) {
  return (
    <Card as="section" padding="lg" className={styles.card}>
      {lead}
      {title && (
        <h2 className={styles.title}>
          {icon && <Icon name={icon} size={20} />}
          {title}
        </h2>
      )}
      {children}
    </Card>
  );
}
