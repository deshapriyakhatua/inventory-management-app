import Button from "@/components/ui/Button/Button";
import FormField from "@/components/ui/FormField/FormField";
import Icon from "@/components/ui/Icon/Icon";
import Input from "@/components/ui/Input/Input";
import Modal from "@/components/ui/Modal/Modal";
import styles from "./DeleteListingModal.module.css";

export default function DeleteListingModal({
    deletingListing,
    deleteInputText,
    deleteButtonLoading,
    onInputChange,
    onInputKeyDown,
    onConfirm,
    onClose,
}) {
    return (
        <Modal
            open
            onClose={onClose}
            size="sm"
            title={
                <span className={styles.title}>
                    <Icon name="icon-cfd589e1" size={22} />
                    Confirm Deletion
                </span>
            }
        >
            <div className={styles.root}>
                <p className={styles.message}>
                    Are you sure you want to delete listing <strong className={styles.sku}>{deletingListing.skuId}</strong>? This action cannot be undone.
                </p>
                <FormField
                    label={<>To confirm, type <span className={styles.keyword}>delete</span> below:</>}
                >
                    <Input
                        type="text"
                        placeholder="Type 'delete' to confirm"
                        value={deleteInputText}
                        onChange={onInputChange}
                        onKeyDown={onInputKeyDown}
                        data-autofocus
                    />
                </FormField>

                <div className={styles.actions}>
                    <Button variant="secondary" onClick={onClose} disabled={deleteButtonLoading}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={onConfirm}
                        disabled={deleteInputText.trim().toLowerCase() !== "delete"}
                        loading={deleteButtonLoading}
                    >
                        {deleteButtonLoading ? "Deleting..." : "Delete Listing"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
