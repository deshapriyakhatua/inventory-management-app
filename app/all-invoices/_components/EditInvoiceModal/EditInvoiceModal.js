import EditBuyerSection from "../EditBuyerSection/EditBuyerSection";
import EditHeaderSection from "../EditHeaderSection/EditHeaderSection";
import EditLineItemRow from "../EditLineItemRow/EditLineItemRow";
import EditPaymentSection from "../EditPaymentSection/EditPaymentSection";
import styles from "./EditInvoiceModal.module.css";

export default function EditInvoiceModal({
  editingInvoice,
  modalAutoStatus,
  isSavingEdit,
  fieldHandlers,
  onLineItemChange,
  onRemoveLineItem,
  onAddLineItem,
  onClose,
  onSubmit,
}) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            Edit Invoice #{editingInvoice.invoiceNumber}
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <EditHeaderSection
            editingInvoice={editingInvoice}
            modalAutoStatus={modalAutoStatus}
            onInvoiceNumberChange={fieldHandlers.onInvoiceNumberChange}
            onInvoiceDateChange={fieldHandlers.onInvoiceDateChange}
            onPlaceOfSupplyChange={fieldHandlers.onPlaceOfSupplyChange}
            onPaymentStatusChange={fieldHandlers.onPaymentStatusChange}
          />

          <EditBuyerSection
            editingInvoice={editingInvoice}
            onBuyerFieldChange={fieldHandlers.onBuyerFieldChange}
          />

          <div className={styles.modalSectionTitle}>Line Items</div>
          {editingInvoice.lineItems.map((item, idx) => (
            <EditLineItemRow
              key={idx}
              item={item}
              idx={idx}
              onChange={onLineItemChange}
              onRemove={onRemoveLineItem}
            />
          ))}

          <button
            type="button"
            style={{
              background: "rgba(59,130,246,0.15)",
              color: "#60a5fa",
              border: "1px dashed #3b82f6",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              marginTop: "6px",
            }}
            onClick={onAddLineItem}
          >
            + Add Line Item
          </button>

          <EditPaymentSection
            editingInvoice={editingInvoice}
            onUpiIdChange={fieldHandlers.onUpiIdChange}
            onShippingFeeChange={fieldHandlers.onShippingFeeChange}
            onDiscountChange={fieldHandlers.onDiscountChange}
            onReceivedAmountChange={fieldHandlers.onReceivedAmountChange}
          />

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isSavingEdit}
            >
              {isSavingEdit ? "Saving Changes..." : "Save Invoice Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
