import AgentLoop from "./BlogVisual/AgentLoop.jsx"
import VmCompare from "./BlogVisual/VmCompare.jsx"
import VmStack from "./BlogVisual/VmStack.jsx"
import VsockPath from "./BlogVisual/VsockPath.jsx"

const VISUALS = {
  "why-we-built-boxcompute": {
    art: <AgentLoop />,
    caption: "The loop that mattered — one workflow node hands the agent a sandbox, and the investigate cycle runs inside it.",
  },
  "why-we-chose-kubevirt": {
    art: <VmStack />,
    caption: "Where each layer lives — KubeVirt manages the VM lifecycle in Kubernetes, QEMU/KVM still runs it, and the agent gets a whole guest.",
  },
  "kubevirt-vsock-ebpf": {
    art: <VsockPath />,
    caption: "Draw the path first — VSOCK bypasses the guest NIC entirely, so IP firewalls never see it. The enforceable point is the host listener.",
  },
  "vm-sandboxes": {
    art: <VmCompare />,
    caption: "gVisor vs VM at a glance — and the one lifecycle fact that affects your bill.",
  },
}

export default function BlogVisual({ slug }) {
  const visual = VISUALS[slug]
  if (!visual) return null
  return (
    <figure data-component="post-visual">
      {visual.art}
      <figcaption data-slot="post-visual-caption">
        <span aria-hidden="true">Fig.</span> {visual.caption}
      </figcaption>
    </figure>
  )
}
