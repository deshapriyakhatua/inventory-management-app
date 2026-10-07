import Icon from "@/components/ui/Icon/Icon";
import Avatar from "../Avatar/Avatar";
import styles from "./SellerCard.module.css";

export default function SellerCard({ seller, user, onSelect, onRestore, onArchive }) {
  /* ── Icons ── */
  const iconPhone = <Icon name="icon-2d625620" size={14} />;
  const iconMail = <Icon name="icon-4d0b16f6" size={14} />;
  const iconMap = <Icon name="icon-28f62de3" size={14} />;
  const iconShip = <Icon name="icon-d4e3f44f" size={14} />;
  const iconGst = <Icon name="pdf-preview" size={14} />;

  return (
    <div className={styles.card} onClick={() => onSelect(seller)}>
      {/* Delete or Restore button */}
      {(user?.role === "admin" || user?.role === "superadmin") && seller.isArchived ? (
        <button
          className={styles.deleteCardBtn}
          onClick={(e) => { e.stopPropagation(); onRestore(seller._id); }}
          title="Restore Seller"
          style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}
        >
          <Icon name="restore-inventory" size={14} />
        </button>
      ) : (
        !seller.isArchived && (
          <button
            className={styles.deleteCardBtn}
            onClick={(e) => { e.stopPropagation(); onArchive(seller._id); }}
            title="Archive Seller"
          >
            <Icon name="trash" size={14} />
          </button>
        )
      )}

      <div className={styles.cardTop}>
        <Avatar name={seller.businessName} className={styles.avatar} />
        <div className={styles.cardMeta}>
          <p className={styles.cardName}>
            {seller.businessName}
            {seller.isArchived && (
              <span style={{ marginLeft: "8px", fontSize: "0.65rem", padding: "2px 6px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", textTransform: "uppercase" }}>Archived</span>
            )}
          </p>
          {seller.contactPerson && <p className={styles.cardPerson}>{seller.contactPerson}</p>}
        </div>
      </div>

      <div className={styles.cardDetails}>
        {seller.phoneNo && (
          <div className={styles.cardRow}>
            {iconPhone}
            <span>{seller.phoneNo}</span>
          </div>
        )}
        {seller.email && (
          <div className={styles.cardRow}>
            {iconMail}
            <span className={styles.truncate}>{seller.email}</span>
          </div>
        )}
        {seller.gstNo && (
          <div className={styles.cardRow}>
            {iconGst}
            <span className={styles.gstTag}>{seller.gstNo}</span>
          </div>
        )}
        {(seller.state || seller.country) && (
          <div className={styles.cardRow}>
            {iconMap}
            <span>{[seller.state, seller.country].filter(Boolean).join(", ")}</span>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        {seller.shippingProvider && (
          <span className={styles.shipBadge}>
            {iconShip} {seller.shippingProvider}
          </span>
        )}
        <span className={styles.addedDate}>
          {new Date(seller.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}
