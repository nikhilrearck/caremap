import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import palette from "@/utils/theme/color";
import {
  getMedicalConditionsByPatient,
  createMedicalCondition,
  deleteMedicalCondition,
  updateMedicalCondition,
} from "@/services/core/PatientService";
import { PatientContext } from "@/context/PatientContext";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { Spinner } from "@/components/ui/spinner";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import Header from "@/components/shared/Header";
import ActionPopover from "@/components/shared/ActionPopover";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { MedicalCondition } from "@/services/database/migrations/v1/schema_v1";

const linkedHealthSystem = [
  "Attention Deficient and Hyperactivity Disorder (ADHD)",
  "Irritable Bowel Syndrome (IBS)",
];

export default function MedicalConditions() {
  const { patient } = useContext(PatientContext);
  const [userConditions, setUserConditions] = useState<MedicalCondition[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCondition, setEditingCondition] = useState<
    { id: number; name: string } | undefined
  >(undefined);
  const [loading, setLoading] = useState(false);

  // for Alert while delete
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [conditionToDelete, setConditionToDelete] =
    useState<MedicalCondition | null>(null);

  // Custom toast
  const showToast = useCustomToast();

  const fetchConditions = async () => {
    if (!patient?.id) {
      console.log("No patient id found");
      return;
    }
    setLoading(true);
    try {
      const conditions = await getMedicalConditionsByPatient(patient.id);
      // console.log(conditions);
      setUserConditions(conditions);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConditions();
  }, [patient]);

  // add/update medicalCondition
  const handleAddMedicalCondition = async (condition: {
    id?: number;
    name: string;
  }) => {
    if (!patient?.id) return;
    if (condition.id) {
      //edit
      await updateMedicalCondition(
        { condition_name: condition.name }, // fields to update
        { id: condition.id } // where clause
      );
      await fetchConditions(); // Refresh list after editing
      showToast({
        title: "Condition Updated",
        description: "Medical condition updated successfully!",
      });
    } else {
      // Add new condition
      await createMedicalCondition({
        patient_id: patient.id,
        condition_name: condition.name,
      });
      await fetchConditions(); // Refresh list after adding
      showToast({
        title: "Condition Added",
        description: "Medical condition added successfully!",
      });
    }
  };

  // open edit form
  const handleEdit = (condition: { id: number; name: string }) => {
    setEditingCondition({ id: condition.id, name: condition.name });
    setShowAddForm(true);
  };

  if (showAddForm) {
    return (
      <AddMedicalConditionsPage
        onClose={() => {
          setShowAddForm(false);
          setEditingCondition(undefined);
        }}
        handleAddMedicalCondition={handleAddMedicalCondition}
        editingCondition={editingCondition}
      />
    );
  }

  // Format date for display
  function getFormattedConditionDate(condition: MedicalCondition): string {
    const showUpdated =
      condition.updated_at && condition.updated_at !== condition.created_at;
    const dateToShow = showUpdated
      ? condition.updated_at
      : condition.created_at;
    return dateToShow
      ? new Date(dateToShow)
          .toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "2-digit",
          })
          .replace(/\//g, "-")
      : "";
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <Header title="Medical Conditions" />

      <View className="px-6 pt-4 flex-1">
        {/* Linked Health System */}
        <View className="mb-6 mt-4">
          <Text
            className="text-lg font-semibold"
            style={{ color: palette.heading }}
          >
            Medical Conditions (Linked Health System)
          </Text>

          {/* hr */}
          <View className="h-px bg-gray-300 my-3" />

          <View>
            <FlatList
              data={linkedHealthSystem}
              renderItem={({ item }) => (
                <View className="border border-gray-200 rounded-lg p-2 bg-gray-100 mb-2">
                  <Text className="text-lg">{item}</Text>
                </View>
              )}
              keyExtractor={(_, index) => index.toString()}
              ListEmptyComponent={
                <Text className="text-gray-500">
                  No user linked health system found.
                </Text>
              }
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
              style={{ minHeight: 50, maxHeight: 160 }}
            />
          </View>
        </View>

        {/* User Entered */}
        <View>
          <Text
            className="text-lg font-semibold"
            style={{ color: palette.heading }}
          >
            Medical Conditions (User entered)
          </Text>

          {/* hr */}
          <View className="h-px bg-gray-300 my-3" />

          <View>
            {loading ? (
              <View className="justify-center items-center min-h-[120px]">
                <Spinner size="large" color={palette.primary} />
                <Text className="mt-5">Loading...</Text>
              </View>
            ) : (
              <FlatList
                data={userConditions}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                showsVerticalScrollIndicator={true}
                renderItem={({ item }) => {
                  const formattedDate = getFormattedConditionDate(item);
                  return (
                    <View className="flex-row items-center justify-between border border-gray-300 rounded-lg px-3 py-3 mb-3">
                      <View className="flex-row items-center space-x-2">
                        <Text className="text-lg ml-3 max-w-[220px] text-left">
                          {item.condition_name}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-lg text-gray-500 mr-3">
                          {formattedDate}
                        </Text>
                        <ActionPopover
                          onEdit={() => {
                            handleEdit({
                              id: item.id,
                              name: item.condition_name,
                            });
                          }}
                          onDelete={() => {
                            setConditionToDelete(item);
                            setShowAlertDialog(true);
                          }}
                        />
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <Text className="text-gray-500">
                    No Medical conditions found.
                  </Text>
                }
                style={{ minHeight: 50, maxHeight: 250 }}
              />
            )}
          </View>
        </View>

        {/* hr */}
        <View className="h-px bg-gray-300 mb-2" />

        {/* Add Condition Button */}
        <TouchableOpacity
          className="rounded-md py-3 items-center mt-1"
          onPress={() => setShowAddForm(true)}
          style={{ backgroundColor: palette.primary }}
        >
          <Text className="text-white font-medium text-lg">
            Add medical condition
          </Text>
        </TouchableOpacity>
      </View>

      <CustomAlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        size="lg"
        title="Are you sure you want to delete?"
        description={conditionToDelete?.condition_name}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          if (conditionToDelete) {
            await deleteMedicalCondition(conditionToDelete.id);
            await fetchConditions();
            showToast({
              title: "Condition Deleted",
              description: "Medical condition deleted successfully!",
            });
          }
          setShowAlertDialog(false);
          setConditionToDelete(null);
        }}
        confirmButtonProps={{
          style: { backgroundColor: palette.primary, marginLeft: 8 },
        }}
      >
        {/* children */}
        {/* <View className="flex-row items-center justify-between border border-gray-300 rounded-lg px-3 py-3 mb-3">
            <View className="flex-row items-center">
              <Text className="text-lg ml-3 max-w-[220px] text-left">
                {conditionToDelete?.name}
              </Text>
            </View>
          </View> */}
      </CustomAlertDialog>
    </SafeAreaView>
  );
}

function AddMedicalConditionsPage({
  onClose,
  handleAddMedicalCondition,
  editingCondition,
}: {
  onClose: () => void;
  handleAddMedicalCondition: (condition: { id?: number; name: string }) => void;
  editingCondition?: { id: number; name: string };
}) {
  const [condition, setCondition] = useState(editingCondition?.name || "");
  // console.log(condition);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <Header title="Medical Conditions" />

        <View className="px-6 py-8">
          <Text
            className="text-lg font-medium mb-3"
            style={{ color: palette.heading }}
          >
            {editingCondition
              ? "Edit your current medical condition"
              : "Add your current medical condition"}
          </Text>

          <Textarea
            size="md"
            isReadOnly={false}
            isInvalid={false}
            isDisabled={false}
            className="w-full"
          >
            <TextareaInput
              placeholder="Enter condition"
              style={{ textAlignVertical: "top", fontSize: 16 }}
              value={condition}
              onChangeText={setCondition}
            />
          </Textarea>

          <TouchableOpacity
            className="py-3 rounded-md mt-3"
            style={{ backgroundColor: palette.primary }}
            onPress={() => {
              if (condition.trim()) {
                handleAddMedicalCondition({
                  id: editingCondition?.id,
                  name: condition.trim(),
                });
              }
              onClose(); // Go back to list
            }}
          >
            <Text className="text-white font-bold text-center">
              {editingCondition ? "Update" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
