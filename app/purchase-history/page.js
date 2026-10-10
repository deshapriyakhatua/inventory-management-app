"use client";

import React from "react";
import PageShell from "@/components/ui/PageShell/PageShell";

import PurchaseToolbar from "./_components/PurchaseToolbar/PurchaseToolbar";
import SummaryStats from "./_components/SummaryStats/SummaryStats";
import GroupedTable from "./_components/GroupedTable/GroupedTable";
import FlatTable from "./_components/FlatTable/FlatTable";
import PurchasePagination from "./_components/PurchasePagination/PurchasePagination";
import ArchivedSection from "./_components/ArchivedSection/ArchivedSection";
import ImagePreviewPopover from "./_components/ImagePreviewPopover/ImagePreviewPopover";
import EditPurchaseModal from "./_components/EditPurchaseModal/EditPurchaseModal";
import ConfirmModal from "./_components/ConfirmModal/ConfirmModal";
import usePurchaseData from "@/app/purchase-history/_hooks/usePurchaseData";
import usePurchaseView from "@/app/purchase-history/_hooks/usePurchaseView";
import usePurchaseConfirmFlows from "@/app/purchase-history/_hooks/usePurchaseConfirmFlows";
import usePurchaseEdit from "@/app/purchase-history/_hooks/usePurchaseEdit";
import usePurchaseExport from "@/app/purchase-history/_hooks/usePurchaseExport";
import useImagePreview from "@/app/purchase-history/_hooks/useImagePreview";

export default function PurchaseHistoryPage() {
  const {
    loading, purchases, setPurchases, showArchived, archivedPurchases, setArchivedPurchases,
    loadingArchived, fetchPurchases, fetchArchivedPurchases, toggleShowArchived,
  } = usePurchaseData();

  const {
    viewMode, setViewMode, expandedGroups, archivedExpandedGroups, searchQuery, statusFilter,
    currentPage, sortConfig, handleSort, filteredItems, processedGroups, summaryStats,
    archivedProcessedGroups, totalPages, paginatedGroups, paginatedFlatItems, toggleGroupExpand,
    isAllExpanded, handleSearchChange, handleStatusFilterChange, toggleExpandAllActive,
    toggleExpandAllArchived, goToPrevPage, goToNextPage,
  } = usePurchaseView({ purchases, archivedPurchases });

  const {
    archiveTarget, archiveInput, isArchiving, archiveInputRef,
    restoreTarget, restoreInput, isRestoring, restoreInputRef,
    deleteTarget, pinInput, pinError, isDeleting, pinInputRef,
    openArchiveModal, closeArchiveModal, confirmArchive,
    openRestoreModal, closeRestoreModal, confirmRestore,
    openDeleteModal, closeDeleteModal, confirmDelete,
    handleArchiveInputChange, handleArchiveKeyDown, handleRestoreInputChange,
    handleRestoreKeyDown, handlePinInputChange, handlePinKeyDown,
  } = usePurchaseConfirmFlows({
    showArchived, setPurchases, setArchivedPurchases, fetchPurchases, fetchArchivedPurchases,
  });

  const { isEditing, editingData, isSaving, openEditModal, closeEditModal, handleEditChange, saveEdit } =
    usePurchaseEdit({ setPurchases });

  const { exportGroupedToExcel, copyToClipboard } = usePurchaseExport({
    showArchived, archivedProcessedGroups, processedGroups, archivedPurchases, filteredItems,
  });

  const { hoveredImage, handleImageMouseEnter, handleImageMouseLeave } = useImagePreview();

  // ── TABLE RENDERER: GROUPED VIEW ─────────────────────────────────
  const renderGroupedTable = (groups, isArchived = false, isLoading = false) => (
    <GroupedTable
      groups={groups}
      isArchived={isArchived}
      loading={isLoading}
      expandedGroups={isArchived ? archivedExpandedGroups : expandedGroups}
      sortConfig={sortConfig}
      onSort={handleSort}
      onToggleGroup={toggleGroupExpand}
      onCopy={copyToClipboard}
      onImageMouseEnter={handleImageMouseEnter}
      onImageMouseLeave={handleImageMouseLeave}
      onEdit={openEditModal}
      onArchive={openArchiveModal}
      onRestore={openRestoreModal}
      onDelete={openDeleteModal}
    />
  );

  // ── TABLE RENDERER: FLAT VIEW ────────────────────────────────────
  const renderFlatTable = (rows, isArchived = false, isLoading = false) => (
    <FlatTable
      rows={rows}
      isArchived={isArchived}
      loading={isLoading}
      sortConfig={sortConfig}
      onSort={handleSort}
      onImageMouseEnter={handleImageMouseEnter}
      onImageMouseLeave={handleImageMouseLeave}
      onEdit={openEditModal}
      onArchive={openArchiveModal}
      onRestore={openRestoreModal}
      onDelete={openDeleteModal}
    />
  );

  return (
    <PageShell>
      <PurchaseToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showExpandToggle={viewMode === "grouped" && processedGroups.length > 0}
        allExpanded={isAllExpanded(false)}
        onToggleExpandAll={toggleExpandAllActive}
        onExport={exportGroupedToExcel}
        showArchived={showArchived}
        onToggleShowArchived={toggleShowArchived}
        refreshing={loading}
        onRefresh={fetchPurchases}
      />

      {!loading && <SummaryStats stats={summaryStats} />}

      {viewMode === "grouped"
        ? renderGroupedTable(paginatedGroups, false, loading)
        : renderFlatTable(paginatedFlatItems, false, loading)
      }

      {!loading && totalPages > 1 && (
        <PurchasePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={goToPrevPage}
          onNext={goToNextPage}
        />
      )}

      {showArchived && (
        <ArchivedSection
          count={archivedPurchases.length}
          showExpandToggle={viewMode === "grouped" && archivedProcessedGroups.length > 0}
          allExpanded={isAllExpanded(true)}
          onToggleExpandAll={toggleExpandAllArchived}
        >
          {viewMode === "grouped"
            ? renderGroupedTable(archivedProcessedGroups, true, loadingArchived)
            : renderFlatTable(archivedPurchases, true, loadingArchived)
          }
        </ArchivedSection>
      )}

      {/* ── EDIT MODAL ─────────────────────────────────────────── */}
      {isEditing && editingData && (
        <EditPurchaseModal
          editingData={editingData}
          isSaving={isSaving}
          onChange={handleEditChange}
          onCancel={closeEditModal}
          onSave={saveEdit}
        />
      )}

      {/* ── ARCHIVE CONFIRM MODAL ──────────────────────────────── */}
      {archiveTarget && (
        <ConfirmModal
          kind="archive"
          target={archiveTarget}
          inputRef={archiveInputRef}
          inputValue={archiveInput}
          onInputChange={handleArchiveInputChange}
          onInputKeyDown={handleArchiveKeyDown}
          isBusy={isArchiving}
          confirmDisabled={isArchiving || archiveInput.trim().toLowerCase() !== "archive"}
          onClose={closeArchiveModal}
          onConfirm={confirmArchive}
        />
      )}

      {/* ── RESTORE CONFIRM MODAL ──────────────────────────────── */}
      {restoreTarget && (
        <ConfirmModal
          kind="restore"
          target={restoreTarget}
          inputRef={restoreInputRef}
          inputValue={restoreInput}
          onInputChange={handleRestoreInputChange}
          onInputKeyDown={handleRestoreKeyDown}
          isBusy={isRestoring}
          confirmDisabled={isRestoring || restoreInput.trim().toLowerCase() !== "restore"}
          onClose={closeRestoreModal}
          onConfirm={confirmRestore}
        />
      )}

      {/* ── DELETE PERMANENTLY MODAL (PIN) ─────────────────────── */}
      {deleteTarget && (
        <ConfirmModal
          kind="delete"
          target={deleteTarget}
          inputRef={pinInputRef}
          inputValue={pinInput}
          onInputChange={handlePinInputChange}
          onInputKeyDown={handlePinKeyDown}
          error={pinError}
          isBusy={isDeleting}
          confirmDisabled={isDeleting || !pinInput}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
        />
      )}


      {hoveredImage && <ImagePreviewPopover image={hoveredImage} />}
    </PageShell>
  );
}
