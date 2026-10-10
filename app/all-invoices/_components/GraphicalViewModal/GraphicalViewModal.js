import Card from "@/components/ui/Card/Card";
import Icon from "@/components/ui/Icon/Icon";
import Modal from "@/components/ui/Modal/Modal";
import cx from "@/components/ui/cx";
import { formatDateGB } from "../../allInvoicesUtils";
import GraphicalItemCard from "../GraphicalItemCard/GraphicalItemCard";
import StatusBadge from "../StatusBadge/StatusBadge";
import styles from "./GraphicalViewModal.module.css";

// Graphical View Modal (Invoice Details & Inventory Images)
export default function GraphicalViewModal({ graphicalModalInvoice, inventoryList, onClose }) {
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={
        <span className={styles.title}>
          Invoice #{graphicalModalInvoice.invoiceNumber}
          <StatusBadge status={graphicalModalInvoice.paymentStatus} />
        </span>
      }
      description={`Date: ${formatDateGB(graphicalModalInvoice.invoiceDate)} • Place of Supply: ${graphicalModalInvoice.placeOfSupply || "19-West Bengal"}`}
    >
      <div className={styles.root}>
        {/* Customer & Seller Grid */}
        <div className={styles.parties}>
          {/* Customer Card */}
          <Card className={styles.infoBox}>
            <h3 className={styles.infoTitle}>
              <Icon name="icon-a887788a" size={16} />
              Customer Info
            </h3>
            <div className={styles.infoName}>
              {graphicalModalInvoice.buyerDetails?.businessName || "N/A"}
            </div>
            {graphicalModalInvoice.buyerDetails?.phoneNo && (
              <div className={styles.infoText}>
                Phone: {graphicalModalInvoice.buyerDetails.phoneNo}
              </div>
            )}
            {graphicalModalInvoice.buyerDetails?.address && (
              <div className={styles.infoText}>
                Address: {graphicalModalInvoice.buyerDetails.address}
              </div>
            )}
            <div className={styles.infoText}>
              GSTIN: {graphicalModalInvoice.buyerDetails?.gstNo || "NA"} | State: {graphicalModalInvoice.buyerDetails?.state || "19-West Bengal"}
            </div>
          </Card>

          {/* Seller Card */}
          <Card className={styles.infoBox}>
            <h3 className={styles.infoTitle}>
              <Icon name="icon-d5851a0c" size={16} />
              Seller Details
            </h3>
            <div className={styles.infoName}>
              {graphicalModalInvoice.sellerDetails?.businessName || "CRAZYKUDI"}
            </div>
            <div className={styles.infoText}>
              GSTIN: {graphicalModalInvoice.sellerDetails?.gstNo || "19JHWPK2955Q1ZW"}
            </div>
            {graphicalModalInvoice.sellerDetails?.bankName && (
              <div className={styles.infoText}>
                Bank: {graphicalModalInvoice.sellerDetails.bankName} (A/C: {graphicalModalInvoice.sellerDetails.accountNo})
              </div>
            )}
          </Card>
        </div>

        {/* Line Items Graphical View */}
        <section className={styles.items}>
          <h3 className={cx(styles.infoTitle, styles.itemsTitle)}>
            <Icon name="icon-d0275ba0" size={16} />
            Items & Inventory Images ({graphicalModalInvoice.lineItems?.length || 0})
          </h3>

          {graphicalModalInvoice.lineItems?.map((item, idx) => (
            <GraphicalItemCard key={idx} item={item} inventoryList={inventoryList} />
          ))}
        </section>

        {/* Financial Summary */}
        <dl className={styles.summary}>
          <div className={styles.summaryRow}>
            <dt>Subtotal:</dt>
            <dd>₹{(graphicalModalInvoice.subtotal || 0).toFixed(2)}</dd>
          </div>
          <div className={styles.summaryRow}>
            <dt>GST Total:</dt>
            <dd>₹{(graphicalModalInvoice.totalTax || 0).toFixed(2)}</dd>
          </div>
          {graphicalModalInvoice.shippingFee > 0 && (
            <div className={styles.summaryRow}>
              <dt>Shipping Fee:</dt>
              <dd>₹{(graphicalModalInvoice.shippingFee || 0).toFixed(2)}</dd>
            </div>
          )}
          {graphicalModalInvoice.discount > 0 && (
            <div className={styles.summaryRow}>
              <dt>Discount:</dt>
              <dd>- ₹{(graphicalModalInvoice.discount || 0).toFixed(2)}</dd>
            </div>
          )}
          <div className={cx(styles.summaryRow, styles.grandTotalRow)}>
            <dt>Grand Total:</dt>
            <dd>₹{(graphicalModalInvoice.grandTotal || 0).toFixed(2)}</dd>
          </div>
          <div className={styles.summaryRow}>
            <dt>Received Amount:</dt>
            <dd>₹{(graphicalModalInvoice.receivedAmount || 0).toFixed(2)}</dd>
          </div>
          <div className={cx(styles.summaryRow, styles.balanceRow)}>
            <dt>Balance Due:</dt>
            <dd>₹{(graphicalModalInvoice.balanceAmount || 0).toFixed(2)}</dd>
          </div>
        </dl>

        {/* Notes if present */}
        {graphicalModalInvoice.notes && (
          <Card className={styles.infoBox}>
            <h3 className={cx(styles.infoTitle, styles.notesTitle)}>
              Notes & Terms
            </h3>
            <div className={styles.notes}>
              {graphicalModalInvoice.notes}
            </div>
          </Card>
        )}
      </div>
    </Modal>
  );
}
