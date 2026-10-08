import Badge from "@/components/ui/Badge/Badge";
import Icon from "@/components/ui/Icon/Icon";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import styles from "./SalesLogHeader.module.css";
import { MONTHS } from "../../addSalesLogConfig";

export default function SalesLogHeader({ month, year }) {
  return (
    <PageHeader
      title="Monthly Sales Log"
      subtitle="Record aggregated sales data per SKU for a given month"
      actions={
        <Badge tone="accent" className={styles.periodBadge}>
          <Icon name="icon-f5ba4e77" size={16} />
          {MONTHS[month - 1]} {year}
        </Badge>
      }
    />
  );
}
