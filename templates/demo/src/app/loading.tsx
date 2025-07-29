import { IGRPTemplateLoading } from '@igrp/framework-next-design-system'

export default function Loading() {
  const appCode = process.env.IGRP_APP_CODE || ''

  return (
    <IGRPTemplateLoading appCode={appCode} />
  )
}