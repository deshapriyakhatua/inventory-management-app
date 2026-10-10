import Button from "@/components/ui/Button/Button";
import Modal from "@/components/ui/Modal/Modal";
import EditBuyerSection from "../EditBuyerSection/EditBuyerSection";
import EditFormSection from "../EditFormSection/EditFormSection";
import EditHeaderSection from "../EditHeaderSection/EditHeaderSection";
import EditLineItemRow from "../EditLineItemRow/EditLineItemRow";
import EditPaymentSection from "../EditPaymentSection/EditPaymentSection";
import styles from "./EditInvoiceModal.module.css";

export default function EditInvoiceModal({
  open,
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
    <Modal
      open={open}
      onClose={isSavingEdit ? undefined : onClose}
      closeOnScrim={!isSavingEdit}
      size="lg"
      title={`Edit Invoice #${editingInvoice.invoiceNumber}`}
    >
      <form className={styles.form} onSubmit={onSubmit}>
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

        <EditFormSection title="Line Items" grid={false}>
          {editingInvoice.lineItems.map((item, idx) => (
            <EditLineItemRow
              key={idx}
              item={item}
              idx={idx}
              onChange={onLineItemChange}
              onRemove={onRemoveLineItem}
            />
          ))}

          <Button
            variant="secondary"
            size="sm"
            className={styles.addItem}
            onClick={onAddLineItem}
          >
            + Add Line Item
          </Button>
        </EditFormSection>

        <EditPaymentSection
          editingInvoice={editingInvoice}
          onUpiIdChange={fieldHandlers.onUpiIdChange}
          onShippingFeeChange={fieldHandlers.onShippingFeeChange}
          onDiscountChange={fieldHandlers.onDiscountChange}
          onReceivedAmountChange={fieldHandlers.onReceivedAmountChange}
        />

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSavingEdit}>
            {isSavingEdit ? "Saving Changes..." : "Save Invoice Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
