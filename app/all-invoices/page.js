"use client";

import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import PaymentQrModal from "@/components/PaymentQrModal/PaymentQrModal";
import PageShell from "@/components/ui/PageShell/PageShell";
import EditInvoiceModal from "./_components/EditInvoiceModal/EditInvoiceModal";
import GraphicalViewModal from "./_components/GraphicalViewModal/GraphicalViewModal";
import InvoiceMetrics from "./_components/InvoiceMetrics/InvoiceMetrics";
import InvoicesControlBar from "./_components/InvoicesControlBar/InvoicesControlBar";
import InvoicesHeader from "./_components/InvoicesHeader/InvoicesHeader";
import InvoicesTable from "./_components/InvoicesTable/InvoicesTable";
import PdfPreviewModal from "./_components/PdfPreviewModal/PdfPreviewModal";
import useInvoiceList from "@/app/all-invoices/_hooks/useInvoiceList";
import useInvoiceConfirmActions from "@/app/all-invoices/_hooks/useInvoiceConfirmActions";
import useInvoiceEdit from "@/app/all-invoices/_hooks/useInvoiceEdit";
import useInvoiceViewers from "@/app/all-invoices/_hooks/useInvoiceViewers";
import useActionMenu from "@/app/all-invoices/_hooks/useActionMenu";
import useInvoiceExport from "@/app/all-invoices/_hooks/useInvoiceExport";

export default function AllInvoicesPage() {
  const {
    invoices, loading, search, statusFilter, showArchived, inventoryList, fetchInvoices,
    totalRevenue, totalReceived, totalBalance,
    handleShowActive, handleShowArchived, handleSearchChange, handleStatusFilterChange,
  } = useInvoiceList();

  const { confirmModal, setConfirmModal, handleArchive, handleRestore, handlePermanentDelete } =
    useInvoiceConfirmActions({ fetchInvoices });

  const {
    showEditModal, editingInvoice, isSavingEdit, modalAutoStatus, handleOpenEdit,
    handleEditLineItemChange, addEditLineItem, removeEditLineItem, handleSaveEdit,
    handleCloseEditModal, fieldHandlers,
  } = useInvoiceEdit({ fetchInvoices });

  const {
    showPdfModal, viewingInvoice, isDownloadingPdf, showQrCode, pdfPreviewRef,
    showGraphicalModal, graphicalModalInvoice, showPaymentQrModal, setShowPaymentQrModal,
    paymentQrInvoice, handleOpenGraphicalModal, handleOpenPaymentQr, handleOpenPdf,
    handleDownloadPdf, handleClosePdfModal, handleShowQrCodeChange, handleCloseGraphicalModal,
  } = useInvoiceViewers();

  const { openMenuId, menuHandlers } = useActionMenu({
    handleOpenGraphicalModal,
    handleOpenPdf,
    handleOpenPaymentQr,
    handleOpenEdit,
    handleArchive,
    handleRestore,
    handlePermanentDelete,
  });

  const { exportInvoicesToExcel } = useInvoiceExport({ invoices, showArchived });

  return (
    <PageShell>
      {/* Top Header */}
      <InvoicesHeader onExport={exportInvoicesToExcel} />

      {/* Summary Metrics */}
      <InvoiceMetrics
        invoiceCount={invoices.length}
        totalRevenue={totalRevenue}
        totalReceived={totalReceived}
        totalBalance={totalBalance}
      />

      {/* Control Bar: Tabs, Search & Status Filter */}
      <InvoicesControlBar
        showArchived={showArchived}
        onShowActive={handleShowActive}
        onShowArchived={handleShowArchived}
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onRefresh={fetchInvoices}
        loading={loading}
      />

      {/* Main Invoices Table */}
      <InvoicesTable
        invoices={invoices}
        loading={loading}
        showArchived={showArchived}
        openMenuId={openMenuId}
        menuHandlers={menuHandlers}
      />

      {/* EDIT INVOICE MODAL */}
      {editingInvoice && (
        <EditInvoiceModal
          open={showEditModal}
          editingInvoice={editingInvoice}
          modalAutoStatus={modalAutoStatus}
          isSavingEdit={isSavingEdit}
          fieldHandlers={fieldHandlers}
          onLineItemChange={handleEditLineItemChange}
          onRemoveLineItem={removeEditLineItem}
          onAddLineItem={addEditLineItem}
          onClose={handleCloseEditModal}
          onSubmit={handleSaveEdit}
        />
      )}

      {/* VIEW PDF / PRINT MODAL (wraps InvoicePdfPreview; pdfPreviewRef feeds downloadInvoicePdf) */}
      {viewingInvoice && (
        <PdfPreviewModal
          open={showPdfModal}
          viewingInvoice={viewingInvoice}
          pdfPreviewRef={pdfPreviewRef}
          showQrCode={showQrCode}
          onShowQrCodeChange={handleShowQrCodeChange}
          isDownloadingPdf={isDownloadingPdf}
          onDownloadPdf={handleDownloadPdf}
          onClose={handleClosePdfModal}
        />
      )}

      {/* Graphical View Modal (Invoice Details & Inventory Images) */}
      {graphicalModalInvoice && (
        <GraphicalViewModal
          open={showGraphicalModal}
          graphicalModalInvoice={graphicalModalInvoice}
          inventoryList={inventoryList}
          onClose={handleCloseGraphicalModal}
        />
      )}

      {/* Payment QR Generator Modal */}
      <PaymentQrModal
        isOpen={showPaymentQrModal}
        onClose={() => setShowPaymentQrModal(false)}
        invoice={paymentQrInvoice}
      />

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </PageShell>
  );
}
