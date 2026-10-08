import Badge from "@/components/ui/Badge/Badge";
import Card from "@/components/ui/Card/Card";
import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import cx from "@/components/ui/cx";
import Avatar from "../Avatar/Avatar";
import styles from "./SellerCard.module.css";

export default function SellerCard({ seller, user, onSelect, onRestore, onArchive }) {
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <Card as="article" padding="md" className={styles.root}>
      <button
        type="button"
        className={styles.open}
        aria-label={seller.businessName}
        onClick={() => onSelect(seller)}
      />

      {/* Delete or Restore button */}
      {isAdmin && seller.isArchived ? (
        <IconButton
          name="restore-inventory"
          size="sm"
          className={cx(styles.action, styles.isSuccess)}
          onClick={() => onRestore(seller._id)}
          title="Restore Seller"
          aria-label="Restore Seller"
        />
      ) : (
        !seller.isArchived && (
          <IconButton
            name="trash"
            size="sm"
            className={cx(styles.action, styles.isDanger)}
            onClick={() => onArchive(seller._id)}
            title="Archive Seller"
            aria-label="Archive Seller"
          />
        )
      )}

      <div className={styles.top}>
        <Avatar name={seller.businessName} />
        <div className={styles.meta}>
          <p className={styles.name}>
            <span className={styles.nameText}>{seller.businessName}</span>
            {seller.isArchived && <Badge tone="danger" className={styles.archived}>Archived</Badge>}
          </p>
          {seller.contactPerson && <p className={styles.person}>{seller.contactPerson}</p>}
        </div>
      </div>

      <div className={styles.details}>
        {seller.phoneNo && (
          <div className={styles.row}>
            <Icon name="icon-2d625620" size={14} className={styles.rowIcon} />
            <span className={styles.truncate}>{seller.phoneNo}</span>
          </div>
        )}
        {seller.email && (
          <div className={styles.row}>
            <Icon name="icon-4d0b16f6" size={14} className={styles.rowIcon} />
            <span className={styles.truncate}>{seller.email}</span>
          </div>
        )}
        {seller.gstNo && (
          <div className={styles.row}>
            <Icon name="pdf-preview" size={14} className={styles.rowIcon} />
            <span className={styles.gst}>{seller.gstNo}</span>
          </div>
        )}
        {(seller.state || seller.country) && (
          <div className={styles.row}>
            <Icon name="icon-28f62de3" size={14} className={styles.rowIcon} />
            <span className={styles.truncate}>{[seller.state, seller.country].filter(Boolean).join(", ")}</span>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        {seller.shippingProvider && (
          <Badge tone="success" className={styles.ship}>
            <Icon name="icon-d4e3f44f" size={14} /> {seller.shippingProvider}
          </Badge>
        )}
        <span className={styles.date}>
          {new Date(seller.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
    </Card>
  );
}
