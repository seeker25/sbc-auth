<template>
  <section id="dissolution-schedule">
    <!-- Saving/Updating Job -->
    <v-fade-transition>
      <div
        v-if="isSaving"
        class="loading-container"
      >
        <v-progress-circular
          size="50"
          width="5"
          color="primary"
          :indeterminate="isSaving"
        />
      </div>
    </v-fade-transition>
    <article class="section-container px-6 py-8">
      <!-- Dissolution Batch Size -->
      <template v-if="isEdit">
        <v-row no-gutters>
          <v-col
            cols="12"
            sm="3"
          >
            <span id="dissolution-batch-size-text">Dissolution Batch Size</span>
          </v-col>
          <v-col
            cols="12"
            sm="9"
          >
            <v-text-field
              id="dissolution-batch-size-text-field"
              ref="numberOfBusinessesRef"
              v-model="numberOfBusinessesEdit"
              filled
              type="number"
              label="Dissolution Batch Size"
              hint="The number of businesses to be moved into D1 dissolution per batch. Maximum of 600."
              :rules="dissolutionBatchSizeRules"
              req
              persistent-hint
            />
          </v-col>
        </v-row>

        <v-divider class="mb-8 mt-6" />
      </template>

      <!-- Schedule Summary -->
      <v-row no-gutters>
        <v-col
          cols="12"
          sm="3"
        >
          <span id="schedule-summary-text">Schedule Summary</span>
        </v-col>
        <v-col
          cols="12"
          sm="7"
        >
          <span>
            Moving <strong>{{ scheduleSummaryNumber }}</strong> businesses into D1 dissolution every
            <strong>Tuesday, Wednesday, and Thursday</strong> at <strong>12:15 a.m.</strong> Pacific Time.
          </span>
        </v-col>

        <template v-if="!isEdit">
          <v-col
            cols="2"
            sm="2"
            class="text-right"
          >
            <v-btn
              id="edit-btn"
              @click="triggerEditOnOff()"
            >
              <v-icon>mdi-pencil</v-icon>
              <span class="edit-txt">Edit</span>
            </v-btn>
          </v-col>
        </template>
      </v-row>

      <!-- Cancel/Save buttons -->
      <template v-if="isEdit">
        <v-divider class="mb-8 mt-8" />
        <v-row no-gutters>
          <v-col
            cols="12"
            class="text-right"
          >
            <v-btn
              id="cancel-btn"
              color="primary"
              large
              outlined
              class="mr-3"
              @click="triggerEditOnOff()"
            >
              Cancel
            </v-btn>
            <v-btn
              id="save-btn"
              color="primary"
              large
              @click="saveBtnClicked()"
            >
              Save
            </v-btn>
          </v-col>
        </v-row>
      </template>
    </article>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, toRefs } from '@vue/composition-api'
import { useStaffStore } from '@/stores/staff'

export default defineComponent({
  name: 'DissolutionSchedule',
  setup () {
    const state = reactive({
      menu: false,
      numberOfBusinessesEdit: -1,
      numberOfBusinessesNonEdit: -1,
      numberOfBusinessesRef: null,
      isEdit: false,
      isSaving: false
    })
    const staffStore = useStaffStore()

    /** Set local properties to values from the store. */
    onMounted(async () => {
      // Make the call to get the involuntary dissolution configurations array (with batch size only) and set it in store.
      await staffStore.getDissolutionBatchSize()

      // Get the batch size current value (number of businesses to be dissolved per job run)
      const numDissolutions = staffStore.involuntaryDissolutionConfigurations?.configurations[0]?.value
      state.numberOfBusinessesNonEdit = parseInt(numDissolutions)
    })

    /** Edit, Cancel, or Save (successful) button is clicked. */
    const triggerEditOnOff = (): void => {
      // set text field value
      state.numberOfBusinessesEdit = state.numberOfBusinessesNonEdit
      state.isEdit = !state.isEdit
      // closing the menu
      state.menu = false
    }

    /**
     * Save button is clicked. Update the dissolution batch size job.
     * Only save if the inputted number is valid.
     * Show spinner and block buttons.
     */
    const saveBtnClicked = async (): Promise<void> => {
      if (state.numberOfBusinessesRef.validate()) {
        state.isSaving = true // show the spinner
        // Update store configurations array with the new number of inputted batch size
        staffStore.involuntaryDissolutionConfigurations.configurations[0].value = String(state.numberOfBusinessesEdit)
        // Make the PUT call to update the database with the new configurations array (with new batch size number)
        try {
          await staffStore.updateDissolutionConfigurations(staffStore.involuntaryDissolutionConfigurations)
          state.numberOfBusinessesNonEdit = state.numberOfBusinessesEdit
        } catch (err) {
          console.error(err)
        }
        state.isSaving = false // hide the spinner
        triggerEditOnOff()
      }
    }

    /** The array of validations rule(s) for the Dissolution Batch Size text field. */
    const dissolutionBatchSizeRules = computed(() => {
      return [
        v => !!v || 'The number of businesses to be moved into D1 dissolution per batch. Maximum of 600.',
        v => (v % 1 === 0) || 'Enter a whole number between 0 and 600.',
        v => v >= 0 || 'Enter a whole number between 0 and 600.',
        v => v <= 600 || 'Exceeds the maximum of 600 businesses per batch.'
      ]
    })

    /**
     * If non-edit, show the number of businesses into D1 from the store.
     * Otherwise, it'll be reactive to whatever is being typed in the text field.
     */
    const scheduleSummaryNumber = computed(() => {
      return state.isEdit ? state.numberOfBusinessesEdit : state.numberOfBusinessesNonEdit
    })

    return {
      ...toRefs(state),
      dissolutionBatchSizeRules,
      triggerEditOnOff,
      saveBtnClicked,
      scheduleSummaryNumber
    }
  }
})
</script>

<style lang="scss" scoped>
.section-container {
  color: $gray9;

  #dissolution-batch-size-text, #schedule-summary-text {
    color: $gray9;
    font-weight: bold;
  }
}

// Remove background + shadow of the edit button. Change the colors to app blue.
::v-deep #edit-btn {
  background-color: transparent !important;
  color: $app-blue;
  box-shadow: none;

  // Icon color is app blue.
  .v-icon.v-icon {
    color: $app-blue;
  }

  // Increasing the Edit text size by a bit + text color is app blue.
  .edit-txt {
    color: $app-blue;
    font-size: $px-16;
  }
}

// Making the pencil icon smaller
.mdi-pencil:before, .mdi-pencil-set {
  font-size: $px-20;
}

// Hiding the spin button of the v-text-field
::v-deep input::-webkit-outer-spin-button,
::v-deep input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
