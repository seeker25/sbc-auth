<template>
  <div>
    <CautionBox
      data-test="caution-box-details"
      setImportantWord="Important"
      :setAlert="false"
      :setMsg="alertMessage()"
    />
    <v-card
      outlined
      flat
      class="amount-owing-details-card mb-8 mt-8"
      :loading="loading"
    >
      <template #progress>
        <v-progress-linear
          color="red"
          indeterminate
        />
      </template>
      <v-card-text class="py-2 px-6">
        <v-row>
          <v-col cols="9">
            Amount Owing Details
          </v-col>
          <v-col class="text-end">
            {{ currentDateString() }}
          </v-col>
        </v-row>
        <v-divider class="my-2 mt-1" />
        <template v-if="!loading && !statementOwingError">
          <v-row
            v-for="statement in statementsOwing"
            :key="statement.id"
            data-test="statement-row"
          >
            <v-col
              cols="9"
              class="statement-col"
              data-test="statement-label"
            >
              <a
                class="link"
                @click="downloadStatement(statement)"
              >{{ formatStatementString(statement.fromDate, statement.toDate) }}</a>
            </v-col>
            <v-col
              class="text-end statement-col"
              data-test="statement-owing-value"
            >
              {{ formatCurrency(statement.amountOwing) }}
            </v-col>
          </v-row>
          <v-row>
            <v-col
              cols="9"
              class="statement-col"
            >
              Other unpaid transactions
            </v-col>
            <v-col
              class="text-end statement-col"
              data-test="total-other-owing"
            >
              {{ formatCurrency(invoicesOwing) }}
            </v-col>
          </v-row>
          <v-divider class="my-2 mt-1" />
          <v-row class="font-weight-bold">
            <v-col cols="9">
              Total Amount Due
            </v-col>
            <v-col
              class="text-end"
              data-test="total-amount-due"
            >
              {{ formatCurrency(totalAmountDue) }}
            </v-col>
          </v-row>
        </template>
        <template v-if="statementOwingError">
          <div class="pt-4 pb-4">
            <CautionBox
              data-test="caution-box-details"
              setImportantWord="Error"
              :setAlert="true"
              :setMsg="'An error has occurred fetching amount owing details.'"
            />
          </div>
        </template>
      </v-card-text>
    </v-card>
    <div>
      <span class="choose-text">Choose a way to settle your outstanding balance:</span>
    </div>

    <v-card
      outlined
      flat
      class="payment-method-card mb-8 mt-8"
      data-test="cc-payment-card"
    >
      <v-card-text class="payment-method-card-text py-2 d-flex">
        <input
          v-model="selectedPaymentMethod"
          type="radio"
          class="payment-method-radio ml-8 mr-8 d-flex"
          name="payment-method"
          value="cc"
          checked
        >
        <div class="payment-method-description d-flex">
          <div class="payment-type-label d-flex">
            <v-icon
              class="payment-type-icon pr-2"
              large
            >
              mdi-credit-card-outline
            </v-icon>
            <div class="payment-type-description">
              Credit Card
            </div>
          </div>
          <div class="payment-method-description pt-1 d-flex">
            For immediate settlement, pay any outstanding amounts owed using a credit card.
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-card
      v-if="enableEFTBalanceByPADFeature"
      outlined
      flat
      class="payment-method-card mb-8 mt-8"
      data-test="pad-payment-card"
    >
      <v-card-text class="payment-method-card-text py-2 d-flex">
        <input
          v-model="selectedPaymentMethod"
          type="radio"
          class="payment-method-radio ml-8 mr-8 d-flex"
          name="payment-method"
          value="pad"
        >
        <div class="payment-method-description d-flex">
          <div class="payment-type-label d-flex">
            <v-icon
              class="payment-type-icon pr-2"
              large
            >
              mdi-bank-outline
            </v-icon>
            <div class="payment-type-description">
              Pre-authorized Debit
            </div>
          </div>
          <div class="payment-method-description pt-1 d-flex">
            To pay using your Pre-Authorized Debit Account, please note that the Canadian Payment
            Association requires a confirmation period of 3 days before deducting funds.
          </div>
        </div>
      </v-card-text>
    </v-card>
    <v-divider />
    <v-row>
      <v-col
        cols="12"
        class="mt-5 pb-0 d-inline-flex"
      >
        <v-btn
          large
          depressed
          class="secondary-btn"
          data-test="btn-stepper-back"
          @click="goBack"
        >
          <v-icon
            left
            class="mr-2"
          >
            mdi-arrow-left
          </v-icon>
          <span>Back</span>
        </v-btn>
        <v-spacer />
        <v-btn
          :loading="handlingPayment"
          large
          color="primary"
          :disabled="!totalAmountDue"
          @click="goNext"
        >
          <span>Next</span>
          <v-icon class="ml-2">
            mdi-arrow-right
          </v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">

import { PropType, computed, defineComponent, onMounted, reactive, toRefs } from '@vue/composition-api'
import CautionBox from '@/components/auth/common/CautionBox.vue'
import CommonUtils from '@/util/common-util'
import ConfigHelper from 'sbc-common-components/src/util/config-helper'
import { Pages } from '@/util/constants'
import { Payment } from '@/models/Payment'
import moment from 'moment'
import { useDownloader } from '@/composables/downloader'
import { useOrgStore } from '@/stores'

export default defineComponent({
  name: 'OutstandingBalances',
  components: { CautionBox },
  props: {
    orgId: {
      type: String as PropType<string>,
      default: ''
    },
    stepForward: {
      type: Function as PropType<() => void>,
      required: false,
      default: undefined
    },
    enableEFTBalanceByPADFeature: { type: Boolean, default: false }
  },
  emits: ['step-forward'],
  setup (props, { root }) {
    const orgStore = useOrgStore()
    const state = reactive({
      statementsOwing: [],
      invoicesOwing: 0,
      loading: true,
      handlingPayment: false,
      statementOwingError: false,
      selectedPaymentMethod: 'cc',
      statementsSummary: computed(() => orgStore.statementsSummary),
      totalAmountDue: computed<number>(() => {
        const totalStatementOwing = state.statementsOwing.reduce((sum, statement) => sum + statement.amountOwing, 0)
        return totalStatementOwing + state.invoicesOwing
      })
    })
    const { downloadStatement } = useDownloader(orgStore, state)

    const handlePayment = async () => {
      state.handlingPayment = true
      const payment: Payment = await orgStore.createOutstandingAccountPayment(true)
      const baseUrl = ConfigHelper.getAuthContextPath()
      const queryParams = `?paymentId=${payment?.id}`
      const returnUrl = `${baseUrl}/${Pages.MAIN}/${props.orgId}/${Pages.PAY_OUTSTANDING_BALANCE}${queryParams}`
      const encodedUrl = encodeURIComponent(returnUrl)

      // redirect to make payment UI
      await root.$router.push(`${Pages.MAKE_CC_PAYMENT}${payment.id}/transactions/${encodedUrl}`)
      state.handlingPayment = false
    }

    function goBack () {
      root.$router.push(`${Pages.ACCOUNT_SETTINGS}/${Pages.PRODUCT_SETTINGS}`)
    }

    function goNext () {
      handlePayment()
    }

    async function getStatementsOwing () {
      const filterParams = {
        pageNumber: 1,
        pageLimit: 100,
        filterPayload: {
          isOwing: 'true'
        }
      }
      const response = await orgStore.getStatementsList(filterParams, Number(props.orgId))
      state.statementsOwing = response?.items || []
    }

    onMounted(async () => {
      state.loading = true
      state.statementOwingError = false
      try {
        await Promise.all([getStatementsOwing(), orgStore.getStatementsSummary()])
        state.invoicesOwing = state.statementsSummary.totalInvoiceDue
        if (state.totalAmountDue === 0) {
          goBack()
        }
      } catch (error) {
        state.statementOwingError = true
        console.error('Error fetching statements owing.', error)
      }
      state.loading = false
    })

    function currentDateString () {
      return CommonUtils.formatDisplayDate(moment(), 'MMMM DD, YYYY')
    }

    function alertMessage () {
      return 'Please settle any outstanding statements and transactions before changing your payment method, ' +
          'or wait until all unpaid transactions are settled by your current method.'
    }

    return {
      ...toRefs(state),
      goBack,
      goNext,
      alertMessage,
      currentDateString,
      formatStatementString: CommonUtils.formatStatementString,
      formatCurrency: CommonUtils.formatAmount,
      downloadStatement
    }
  }
})

</script>

<style lang="scss" scoped>
@import "$assets/scss/actions.scss";

.link {
  color: var(--v-primary-base) !important;
  text-decoration: underline;
  cursor: pointer;
}

.caution-box {
  color: $gray7;
}

.choose-text {
  font-size: 16px;
  font-weight: bold;
}
.v-card__text {
  color: $gray7 !important;
}

.amount-owing-details-card {
  border-color: $BCgovInputError !important;
  border-width: 2px !important;
  margin-bottom: 12px !important;
  .statement-col {
    padding-top: 4px !important;
    padding-bottom: 4px !important;
  }
}

.payment-method-card {
  border-color: $app-blue !important;
  border-width: 2px !important;
  margin-bottom: 12px !important;

  .payment-method-card-text {
    align-items: center;
    min-height: 120px;
    .payment-method-radio {
      width: 24px;
      height: 24px;
      align-items: center;
      accent-color: $app-blue !important;
    }
    .payment-type-label {
      .payment-type-icon {
        font-size: 24px !important;
        color: $app-dk-blue;
      }
      .payment-type-description {
        font-size: 20px;
        font-weight: bolder;
      }
    }
    .payment-method-description{
      flex-direction: column;
      font-size: 14px;
    }
  }
}
</style>
