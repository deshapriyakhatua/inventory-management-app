import Icon from "@/components/ui/Icon/Icon";
import { formatDateGB } from "../../allInvoicesUtils";
import GraphicalItemCard from "../GraphicalItemCard/GraphicalItemCard";
import StatusBadge from "../StatusBadge/StatusBadge";
import styles from "./GraphicalViewModal.module.css";

// Graphical View Modal (Invoice Details & Inventory Images)
export default function GraphicalViewModal({ graphicalModalInvoice, inventoryList, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.graphicalModal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.pickerHeader}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h3 className={styles.pickerTitle} style={{ margin: 0 }}>
                Invoice #{graphicalModalInvoice.invoiceNumber}
              </h3>
              <StatusBadge status={graphicalModalInvoice.paymentStatus} />
            </div>
            <p className={styles.pickerSubtitle} style={{ marginTop: "4px" }}>
              Date: {formatDateGB(graphicalModalInvoice.invoiceDate)} • Place of Supply: {graphicalModalInvoice.placeOfSupply || "19-West Bengal"}
            </p>
          </div>
          <button
            type="button"
            className={styles.pickerCloseBtn}
            onClick={onClose}
          >
            <Icon name="remove-this-product" />
          </button>
        </div>

        {/* Body */}
        <div className={styles.graphicalModalBody}>
          {/* Customer & Seller Grid */}
          <div className={styles.graphicalGrid2}>
            {/* Customer Card */}
            <div className={styles.graphicalInfoBox}>
              <div className={styles.graphicalInfoTitle}>
                <Icon name="icon-a887788a" size={16} />
                Customer Info
              </div>
              <div style={{ fontWeight: "700", color: "#ffffff", fontSize: "15px" }}>
                {graphicalModalInvoice.buyerDetails?.businessName || "N/A"}
              </div>
              {graphicalModalInvoice.buyerDetails?.phoneNo && (
                <div className={styles.graphicalInfoText}>
                  Phone: {graphicalModalInvoice.buyerDetails.phoneNo}
                </div>
              )}
              {graphicalModalInvoice.buyerDetails?.address && (
                <div className={styles.graphicalInfoText}>
                  Address: {graphicalModalInvoice.buyerDetails.address}
                </div>
              )}
              <div className={styles.graphicalInfoText}>
                GSTIN: {graphicalModalInvoice.buyerDetails?.gstNo || "NA"} | State: {graphicalModalInvoice.buyerDetails?.state || "19-West Bengal"}
              </div>
            </div>

            {/* Seller Card */}
            <div className={styles.graphicalInfoBox}>
              <div className={styles.graphicalInfoTitle}>
                <Icon name="icon-d5851a0c" size={16} />
                Seller Details
              </div>
              <div style={{ fontWeight: "700", color: "#ffffff", fontSize: "15px" }}>
                {graphicalModalInvoice.sellerDetails?.businessName || "CRAZYKUDI"}
              </div>
              <div className={styles.graphicalInfoText}>
                GSTIN: {graphicalModalInvoice.sellerDetails?.gstNo || "19JHWPK2955Q1ZW"}
              </div>
              {graphicalModalInvoice.sellerDetails?.bankName && (
                <div className={styles.graphicalInfoText}>
                  Bank: {graphicalModalInvoice.sellerDetails.bankName} (A/C: {graphicalModalInvoice.sellerDetails.accountNo})
                </div>
              )}
            </div>
          </div>

          {/* Line Items Graphical View */}
          <div>
            <div className={styles.graphicalInfoTitle} style={{ marginBottom: "10px", color: "#ec4899" }}>
              <Icon name="icon-d0275ba0" size={16} />
              Items & Inventory Images ({graphicalModalInvoice.lineItems?.length || 0})
            </div>

            <div className={styles.graphicalItemsContainer}>
              {graphicalModalInvoice.lineItems?.map((item, idx) => (
                <GraphicalItemCard key={idx} item={item} inventoryList={inventoryList} />
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className={styles.summaryContainer} style={{ marginTop: 0 }}>
            <div className={styles.summaryBox} style={{ width: "100%" }}>
              <div className={styles.summaryRow}>
                <span>Subtotal:</span>
                <span>₹{(graphicalModalInvoice.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>GST Total:</span>
                <span>₹{(graphicalModalInvoice.totalTax || 0).toFixed(2)}</span>
              </div>
              {graphicalModalInvoice.shippingFee > 0 && (
                <div className={styles.summaryRow}>
                  <span>Shipping Fee:</span>
                  <span>₹{(graphicalModalInvoice.shippingFee || 0).toFixed(2)}</span>
                </div>
              )}
              {graphicalModalInvoice.discount > 0 && (
                <div className={styles.summaryRow}>
                  <span>Discount:</span>
                  <span>- ₹{(graphicalModalInvoice.discount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className={`${styles.summaryRow} ${styles.grandTotalRow}`}>
                <span>Grand Total:</span>
                <span>₹{(graphicalModalInvoice.grandTotal || 0).toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Received Amount:</span>
                <span>₹{(graphicalModalInvoice.receivedAmount || 0).toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow} style={{ fontWeight: "700", color: "#f87171" }}>
                <span>Balance Due:</span>
                <span>₹{(graphicalModalInvoice.balanceAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes if present */}
          {graphicalModalInvoice.notes && (
            <div className={styles.graphicalInfoBox}>
              <div className={styles.graphicalInfoTitle} style={{ color: "#f59e0b" }}>
                Notes & Terms
              </div>
              <div className={styles.graphicalInfoText} style={{ whiteSpace: "pre-line", fontSize: "13px", color: "#a1a1aa" }}>
                {graphicalModalInvoice.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
