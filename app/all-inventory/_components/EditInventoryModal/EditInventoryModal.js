import Image from "next/image";
import Button from "@/components/ui/Button/Button";
import FormField from "@/components/ui/FormField/FormField";
import Input from "@/components/ui/Input/Input";
import Modal from "@/components/ui/Modal/Modal";
import Select from "@/components/ui/Select/Select";
import styles from "./EditInventoryModal.module.css";

export default function EditInventoryModal({
    editForm,
    verticals,
    editSaving,
    onChange,
    onSubmit,
    onClose,
}) {
    return (
        <Modal open onClose={onClose} size="sm" title="Edit Inventory Item">
            <form onSubmit={onSubmit} className={styles.form}>
                <FormField label="Inventory ID / SKU">
                    <Input
                        type="text"
                        name="inventoryId"
                        value={editForm.inventoryId}
                        onChange={onChange}
                        required
                    />
                </FormField>

                <FormField label="Vertical">
                    <Select
                        name="vertical"
                        value={editForm.vertical}
                        onChange={onChange}
                        required
                    >
                        <option value="">Select Vertical</option>
                        {verticals.map(v => (
                            <option key={v.verticalShort} value={v.verticalName}>{v.verticalName}</option>
                        ))}
                    </Select>
                </FormField>

                <FormField label="Inventory Image">
                    <Input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={onChange}
                    />
                </FormField>

                {editForm.imagePreview && (
                    <div className={styles.preview}>
                        <Image
                            src={editForm.imagePreview}
                            alt="Preview"
                            fill
                            sizes="10rem"
                            className={styles.previewImage}
                        />
                    </div>
                )}

                <div className={styles.actions}>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={editSaving}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" loading={editSaving}>
                        {editSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
