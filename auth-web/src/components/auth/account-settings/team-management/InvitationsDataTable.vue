<template>
  <v-data-table
    class="user-list"
    :headers="headerInvitations"
    :items="indexedInvitations"
    :items-per-page="5"
    :calculate-widths="true"
    :hide-default-footer="indexedInvitations.length <= 5"
    :no-data-text="$t('noPendingInvitesLabel')"
  >
    <template #[`item.recipientEmail`]="{ item }">
      <span :data-test="getIndexedTag('invitation-email', item.index)">
        {{ item.recipientEmail }}
      </span>
    </template>
    <template #[`item.sentDate`]="{ item }">
      <span
        :data-test="getIndexedTag('invitation-sent', item.index)"
      >
        {{ formatDate (item.sentDate, 'MMMM DD, YYYY') }}
      </span>
    </template>
    <template #[`item.expiresOn`]="{ item }">
      <span
        :data-test="getIndexedTag('invitation-expires', item.index)"
      >
        {{ formatDate (item.expiresOn, 'MMMM DD, YYYY') }}
      </span>
    </template>
    <template #[`item.action`]="{ item }">
      <!-- Resend Invitation -->
      <v-btn
        v-if="canApproveOrDeny()"
        icon
        class="mr-1"
        aria-label="Resend invitation"
        title="Resend Invitation"
        :data-test="getIndexedTag('resend-button', item.index)"
        @click="resend(item)"
      >
        <v-icon>mdi-email-send-outline</v-icon>
      </v-btn>

      <!-- Remove Invitation -->
      <v-btn
        v-if="canApproveOrDeny()"
        icon
        aria-label="Remove Invitation"
        title="Remove Invitation"
        :data-test="getIndexedTag('remove-button', item.index)"
        @click="confirmRemoveInvite(item)"
      >
        <v-icon>mdi-trash-can-outline</v-icon>
      </v-btn>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { Component, Emit, Vue } from 'vue-property-decorator'
import CommonUtils from '@/util/common-util'
import { Invitation } from '@/models/Invitation'
import { Role } from '@/util/constants'
import { mapState } from 'pinia'
import { useOrgStore } from '@/stores/org'
import { useUserStore } from '@/stores/user'

@Component({
  computed: {
    ...mapState(useOrgStore, ['pendingOrgInvitations']),
    ...mapState(useUserStore, ['currentUser'])
  }
})
export default class InvitationsDataTable extends Vue {
  private readonly pendingOrgInvitations!: Invitation[]
  readonly headerInvitations = [
    {
      text: 'Email',
      align: 'left',
      sortable: true,
      value: 'recipientEmail'
    },
    {
      text: 'Invitation Sent',
      align: 'left',
      sortable: true,
      value: 'sentDate'
    },
    {
      text: 'Expires',
      align: 'left',
      sortable: true,
      value: 'expiresOn'
    },
    {
      text: 'Actions',
      align: 'right',
      value: 'action',
      sortable: false
    }
  ]

  private canApproveOrDeny (): boolean {
    return !this.currentUser.roles?.includes(Role.ContactCentreStaff)
  }

  formatDate = CommonUtils.formatDisplayDate

  getIndexedTag (tag, index): string {
    return `${tag}-${index}`
  }

  get indexedInvitations () {
    return this.pendingOrgInvitations.map((item, index) => ({
      index,
      ...item
    }))
  }

  @Emit()
  confirmRemoveInvite () {}

  @Emit()
  resend () {}
}
</script>

<style lang="scss" scoped>
::v-deep {
  td {
    padding-top: 1rem !important;
    padding-bottom: 1rem !important;
    height: auto;
  }

  .v-tooltip__content {
    font-size: 10px !important;
  }
}
</style>
