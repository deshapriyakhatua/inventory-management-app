"use client";

import React from "react";
import Button from "@/components/ui/Button/Button";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import PageShell from "@/components/ui/PageShell/PageShell";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";

import BulkActionsMenu from "./_components/BulkActionsMenu/BulkActionsMenu";
import ColumnsMenu from "./_components/ColumnsMenu/ColumnsMenu";
import Pagination from "./_components/Pagination/Pagination";
import RecordsTable from "./_components/RecordsTable/RecordsTable";
import Toolbar from "./_components/Toolbar/Toolbar";
import TotalsSummary from "./_components/TotalsSummary/TotalsSummary";
import { useSalesRecords } from "./useSalesRecords";

export default function SalesRecordsView({ title = "Sales Records", archivedTitle = "Archived Sales Records" }) {
    const {
        loading, refreshing, confirmModal, setConfirmModal, allRecords, selectedRecordIds,
        searchQuery, setSearchQuery, monthFilter, setMonthFilter, yearFilter, setYearFilter,
        channelFilter, setChannelFilter, viewArchived, setViewArchived,
        sortBy, setSortBy, sortOrder, setSortOrder, visibleColumns,
        isColMenuOpen, setIsColMenuOpen, isActionMenuOpen, setIsActionMenuOpen,
        currentPage, setCurrentPage, pageSize, setPageSize, totalItems, totalPages,
        colMenuRef, actionMenuRef, handleRefresh, toggleColumn, toggleRowSelection,
        toggleAllSelection, handleBulkAction, totals, handleHeaderSort,
    } = useSalesRecords();

    const pageTitle = viewArchived ? archivedTitle : title;

    return (
        <PageShell>
            <PageHeader
                title={pageTitle}
                actions={
                    <Button variant="secondary" onClick={() => setViewArchived(!viewArchived)}>
                        {viewArchived ? "View Active Records" : "View Archived"}
                    </Button>
                }
            />

            <Toolbar
                bulkActions={selectedRecordIds.size > 0 && (
                    <BulkActionsMenu
                        menuRef={actionMenuRef}
                        selectedCount={selectedRecordIds.size}
                        isOpen={isActionMenuOpen}
                        onToggle={() => setIsActionMenuOpen(!isActionMenuOpen)}
                        viewArchived={viewArchived}
                        onAction={handleBulkAction}
                    />
                )}
                columnsMenu={
                    <ColumnsMenu
                        menuRef={colMenuRef}
                        isOpen={isColMenuOpen}
                        onToggle={() => setIsColMenuOpen(!isColMenuOpen)}
                        visibleColumns={visibleColumns}
                        onToggleColumn={toggleColumn}
                    />
                }
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                monthFilter={monthFilter}
                onMonthChange={setMonthFilter}
                yearFilter={yearFilter}
                onYearChange={setYearFilter}
                channelFilter={channelFilter}
                onChannelChange={setChannelFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                refreshing={refreshing}
                onRefresh={handleRefresh}
            />

            {!loading && allRecords.length > 0 && (
                <TotalsSummary totals={totals} visibleColumns={visibleColumns} rowCount={allRecords.length} />
            )}

            <RecordsTable
                records={allRecords}
                loading={loading}
                visibleColumns={visibleColumns}
                selectedRecordIds={selectedRecordIds}
                onToggleRow={toggleRowSelection}
                onToggleAll={toggleAllSelection}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onHeaderSort={handleHeaderSort}
            />

            {!loading && totalItems > 0 && (
                <Pagination
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    totalPages={totalPages}
                    loading={loading}
                    onPageSizeChange={setPageSize}
                    onPrevious={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    onNext={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                />
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmLabel={confirmModal.confirmLabel}
                variant={confirmModal.variant}
                isLoading={confirmModal.isLoading}
                onConfirm={confirmModal.onConfirm}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </PageShell>
    );
}
