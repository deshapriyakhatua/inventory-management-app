"use client";
import styles from "./page.module.css";

import PaymentQrModal from "@/components/PaymentQrModal/PaymentQrModal";
import PageShell from "@/components/ui/PageShell/PageShell";

import CompanySettingsModal from "./_components/CompanySettingsModal/CompanySettingsModal";
import CursorImageTooltip from "./_components/CursorImageTooltip/CursorImageTooltip";
import GraphicalViewModal from "./_components/GraphicalViewModal/GraphicalViewModal";
import InventoryPickerModal from "./_components/InventoryPickerModal/InventoryPickerModal";
import InvoiceMetaSection from "./_components/InvoiceMetaSection/InvoiceMetaSection";
import InvoicePageHeader from "./_components/InvoicePageHeader/InvoicePageHeader";
import LineItemsTable from "./_components/LineItemsTable/LineItemsTable";
import MultiSelectInventoryModal from "./_components/MultiSelectInventoryModal/MultiSelectInventoryModal";
import PartyDetails from "./_components/PartyDetails/PartyDetails";
import PaymentSection from "./_components/PaymentSection/PaymentSection";
import PdfPreviewModal from "./_components/PdfPreviewModal/PdfPreviewModal";
import PreviewPane from "./_components/PreviewPane/PreviewPane";
import RecentInvoicesSection from "./_components/RecentInvoicesSection/RecentInvoicesSection";
import TaxSummary from "./_components/TaxSummary/TaxSummary";

import useHistoryModals from "./_hooks/useHistoryModals";
import useInvoiceData from "./_hooks/useInvoiceData";
import useInvoiceForm from "./_hooks/useInvoiceForm";
import useInvoiceSubmit from "./_hooks/useInvoiceSubmit";
import useLineItemPickers from "./_hooks/useLineItemPickers";

export default function CreateB2BInvoicePage() {
  const form = useInvoiceForm();
  const {
    activeTab,
    setActiveTab,
    invoiceNumber,
    setInvoiceNumber,
    invoiceDate,
    placeOfSupply,
    paymentStatus,
    sellerDetails,
    setSellerDetails,
    buyerDetails,
    lineItems,
    setLineItems,
    shippingFee,
    discount,
    receivedAmount,
    showQrCode,
    notes,
    setNotes,
    calculatedRows,
    subtotal,
    totalGst,
    grandTotal,
    balanceAmount,
    autoPaymentStatus,
    invoiceDataForPdf,
  } = form;

  const {
    isGeneratingId,
    inventoryList,
    recentInvoices,
    isLoadingHistory,
    isCompanyModalOpen,
    isSavingCompany,
    fetchNextInvoiceId,
    fetchRecentInvoices,
    handleSaveCompanySettings,
    handleOpenCompanyModal,
    handleCloseCompanyModal,
  } = useInvoiceData({ sellerDetails, setSellerDetails, notes, setNotes, setInvoiceNumber });

  const picker = useLineItemPickers({ lineItems, setLineItems, inventoryList });
  const { inventoryPickerIndex, hoveredImage } = picker;

  const { isSubmitting, isDownloadingPdf, pdfPreviewRef, handleSubmitInvoice, handleDownloadPdf } =
    useInvoiceSubmit({
      invoiceNumber,
      invoiceDate,
      placeOfSupply,
      sellerDetails,
      buyerDetails,
      calculatedRows,
      subtotal,
      totalGst,
      shippingFee,
      discount,
      grandTotal,
      receivedAmount,
      balanceAmount,
      paymentStatus,
      notes,
      fetchRecentInvoices,
      fetchNextInvoiceId,
      setActiveTab,
    });

  const modals = useHistoryModals();
  const { pdfModalInvoice, modalPdfRef, graphicalModalInvoice, setShowPaymentQrModal } = modals;

  return (
    <PageShell>
      <InvoicePageHeader
        activeTab={activeTab}
        showQrCode={showQrCode}
        isDownloadingPdf={isDownloadingPdf}
        onOpenCompanyModal={handleOpenCompanyModal}
        onShowForm={form.handleShowFormTab}
        onShowPreview={form.handleShowPreviewTab}
        onShowQrCodeChange={form.handleShowQrCodeChange}
        onDownloadPdf={handleDownloadPdf}
      />

      {activeTab === "form" ? (
        <form className={styles.form} onSubmit={handleSubmitInvoice}>
          <InvoiceMetaSection
            invoiceNumber={invoiceNumber}
            invoiceDate={invoiceDate}
            placeOfSupply={placeOfSupply}
            paymentStatus={paymentStatus}
            autoPaymentStatus={autoPaymentStatus}
            isGeneratingId={isGeneratingId}
            onInvoiceNumberChange={form.handleInvoiceNumberChange}
            onGenerateId={fetchNextInvoiceId}
            onInvoiceDateChange={form.handleInvoiceDateChange}
            onPlaceOfSupplyChange={form.handlePlaceOfSupplyChange}
            onPaymentStatusChange={form.handlePaymentStatusChange}
          />

          <PartyDetails
            sellerDetails={sellerDetails}
            buyerDetails={buyerDetails}
            onBuyerFieldChange={form.handleBuyerFieldChange}
          />

          <LineItemsTable
            calculatedRows={calculatedRows}
            inventoryList={inventoryList}
            onOpenInventoryPicker={picker.openInventoryPicker}
            onPickerMouseEnter={picker.handlePickerMouseEnter}
            onPickerMouseMove={picker.handlePickerMouseMove}
            onPickerMouseLeave={picker.handlePickerMouseLeave}
            onLineItemChange={picker.handleLineItemChange}
            onRemoveLineItem={picker.removeLineItem}
            onAddItemRow={picker.openMultiSelectModal}
          />

          <TaxSummary
            subtotal={subtotal}
            totalGst={totalGst}
            shippingFee={shippingFee}
            discount={discount}
            grandTotal={grandTotal}
            isSubmitting={isSubmitting}
            onShippingFeeChange={form.handleShippingFeeChange}
            onDiscountChange={form.handleDiscountChange}
          >
            <PaymentSection
              receivedAmount={receivedAmount}
              balanceAmount={balanceAmount}
              showQrCode={showQrCode}
              onReceivedAmountChange={form.handleReceivedAmountChange}
              onShowQrCodeChange={form.handleShowQrCodeChange}
            />
          </TaxSummary>
        </form>
      ) : (
        /* EXACT REPLICA PDF INVOICE PREVIEW */
        <PreviewPane pdfPreviewRef={pdfPreviewRef} invoiceDataForPdf={invoiceDataForPdf} />
      )}

      {/* History Section */}
      <RecentInvoicesSection
        recentInvoices={recentInvoices}
        isLoadingHistory={isLoadingHistory}
        onRefresh={fetchRecentInvoices}
        onOpenGraphicalModal={modals.handleOpenGraphicalModal}
        onOpenPdfModal={modals.handleOpenPdfModal}
        onOpenPaymentQrModal={modals.handleOpenPaymentQrModal}
      />

      {/* Inventory Selection Modal */}
      <InventoryPickerModal
        open={inventoryPickerIndex !== null}
        searchRef={picker.pickerSearchRef}
        inventorySearch={picker.inventorySearch}
        filteredInventory={picker.filteredInventory}
        selectedInventoryId={lineItems[inventoryPickerIndex]?.inventoryId}
        onSearchChange={picker.handleInventorySearchChange}
        onClearSearch={picker.handleClearInventorySearch}
        onSelectItem={picker.selectInventoryItem}
        onClose={picker.closeInventoryPicker}
      />
      {/* Company Details, Bank & Terms Modal */}
      <CompanySettingsModal
        open={isCompanyModalOpen}
        sellerDetails={sellerDetails}
        notes={notes}
        isSavingCompany={isSavingCompany}
        onSellerFieldChange={form.handleSellerFieldChange}
        onNotesChange={form.handleNotesChange}
        onSave={handleSaveCompanySettings}
        onClose={handleCloseCompanyModal}
      />
      {/* Multi-Select Inventory Modal */}
      <MultiSelectInventoryModal
        open={picker.isMultiSelectOpen}
        searchRef={picker.multiSearchRef}
        multiSelectSearch={picker.multiSelectSearch}
        filteredMultiInventory={picker.filteredMultiInventory}
        selectedInvIds={picker.selectedInvIds}
        onSearchChange={picker.handleMultiSelectSearchChange}
        onClearSearch={picker.handleClearMultiSelectSearch}
        onSelectAllFiltered={picker.handleSelectAllFiltered}
        onClearSelection={picker.handleClearSelection}
        onToggleItem={picker.toggleInvSelection}
        onAddBlankRow={picker.handleAddBlankRow}
        onAddSelectedItems={picker.handleAddSelectedItems}
        onClose={picker.closeMultiSelectModal}
      />
      {/* PDF Preview Modal */}
      {pdfModalInvoice && (
        <PdfPreviewModal
          open={modals.showPdfModal}
          pdfModalInvoice={pdfModalInvoice}
          modalPdfRef={modalPdfRef}
          showQrCodePdfModal={modals.showQrCodePdfModal}
          isDownloadingPdfModal={modals.isDownloadingPdfModal}
          onShowQrCodeChange={modals.handleShowQrCodePdfModalChange}
          onDownloadPdf={modals.handleModalDownloadPdf}
          onClose={modals.handleClosePdfModal}
        />
      )}

      {/* Graphical View Modal (Invoice Details & Inventory Images) */}
      {graphicalModalInvoice && (
        <GraphicalViewModal
          open={modals.showGraphicalModal}
          graphicalModalInvoice={graphicalModalInvoice}
          sellerDetails={sellerDetails}
          inventoryList={inventoryList}
          onClose={modals.handleCloseGraphicalModal}
        />
      )}
      {/* Floating Cursor Image Tooltip */}
      {hoveredImage && <CursorImageTooltip hoveredImage={hoveredImage} />}
      {/* Payment QR Generator Modal */}
      <PaymentQrModal
        isOpen={modals.showPaymentQrModal}
        onClose={() => setShowPaymentQrModal(false)}
        invoice={modals.paymentQrInvoice}
      />
    </PageShell>
  );
}
