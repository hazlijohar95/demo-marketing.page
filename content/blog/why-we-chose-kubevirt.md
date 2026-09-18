---
title: Why we chose KubeVirt for our VM sandboxes
slug: why-we-chose-kubevirt
excerpt: We needed full Linux machines without a separate VM management platform. Why KubeVirt fit BoxCompute, and the tradeoffs we accept.
byline: boxy
publishedAt: 2026-09-15
tags: Kubernetes, Virtualization, Infrastructure
---

An agent workspace can start with a shell and a directory. Then a workload needs a background service, a service manager, or Linux behavior that a process-oriented environment does not fully provide. At that point, the question changes from "how do we run this command?" to "how do we give it a machine?"

For BoxCompute's VM sandboxes, we chose **KubeVirt: full virtual machines, managed through Kubernetes**.

The reason was not that Kubernetes is better at virtualization than a hypervisor. It is not a hypervisor. We wanted a real guest operating system without building a separate VM management platform around it.

## We needed a machine, not just a process

Containers are a useful starting point for running commands. An ordinary Linux container isolates processes, but those processes still use the host's kernel—the part of the operating system that manages memory, devices, and system calls.

A VM has its own **guest kernel**, separate from the **host kernel** on the machine running it. That matters for workloads that expect a complete Linux environment, including normal boot and service-management behavior.

For us, support for a real systemd environment was a concrete requirement. Systemd is the service manager used by many Linux distributions: it starts services, manages their dependencies, and supervises them. Running a single program under a lightweight supervisor is not the same contract as booting a Linux machine with systemd.

There are ways to run systemd in containers. But adding host-facing privileges to make an ordinary container behave more like a machine is not an acceptable default for a sandbox executing untrusted code. We wanted that operating-system behavior on the guest side of a VM boundary.

## Full VM capability is a feature for agents

Agents work with tools and instructions built around familiar development environments: shell commands, package managers, filesystem paths, build tools, and services. Project READMEs and troubleshooting guides often assume a normal Linux machine. We want an agent to be able to follow those workflows, rather than spend its effort adapting them to a restricted execution environment.

For example, a task might involve building an application, starting a supporting service, inspecting its logs, and changing its configuration. A full Linux guest gives those steps a consistent operating-system environment. The point is not that containers cannot run services; it is that we want to support machine-level workflows as well as individual commands.

**The full VM is part of the product capability, not just an isolation cost.** Our aim is to put agents in an environment that matches the Linux tools and workflows represented in documentation, code examples, and training material. That is a compatibility goal, not a claim about any particular model's training data or a guarantee that every command will work.

Lighter-weight environments still make sense for narrower tasks. For VM sandboxes, though, full guest behavior is something we deliberately want to provide.

## Booting a VM is only the first problem

QEMU/KVM can run a VM on a Linux host. KVM uses the CPU's hardware virtualization support; QEMU supplies the virtual devices and works with KVM to run the guest.

But a sandbox platform needs answers to questions beyond "can it boot?":

- Which machine has capacity for the next sandbox?
- Who is allowed to create it, and what resources may it consume?
- Which storage belongs to it, and what should survive its deletion?
- What happens if creation fails halfway through?
- How do we know it is ready to accept work?
- How do we stop it and clean up safely?

We already use Kubernetes as the foundation for workload management. Running VMs outside that model would mean integrating another lifecycle system into the sandbox product. That is possible, but it would leave us coordinating placement, permissions, storage, and cleanup across two different management systems.

KubeVirt let us keep the VM lifecycle in the Kubernetes model instead.

## What KubeVirt does—and what still runs the VM

KubeVirt adds VM resource types and controllers to Kubernetes. A **controller** repeatedly compares the requested state with the actual state and takes steps to reconcile them.

A `VirtualMachine` describes the machine and its desired lifecycle. A `VirtualMachineInstance` represents a particular instance. KubeVirt creates a launcher **Pod**—Kubernetes' unit for running containers—which contains the processes that run the VM.

```text
┌──────────────────────────────┐
│ Sandbox lifecycle            │
│ Create, observe, stop, clean │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ Kubernetes + KubeVirt        │
│ Placement and VM lifecycle   │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ Launcher Pod on a worker     │
│ QEMU/KVM runs the VM         │
│ Guest Linux runs the work    │
└──────────────────────────────┘
```

The guest still has its own kernel. Putting the QEMU process in a container does not turn the guest into an ordinary container, or add another layer of virtual hardware by itself.

**KubeVirt is our VM management layer; QEMU/KVM is the virtualization stack underneath it.** We chose the upstream QEMU/KVM path rather than making a custom hypervisor integration a prerequisite for the sandbox platform.

## Why keeping Kubernetes mattered to us

### The same resource-management foundation

A sandbox service must account for many independent workloads. Kubernetes already has a scheduler that places workloads on suitable machines based on resource requests and constraints. KubeVirt makes VM workloads participate in that machinery through their launcher Pods.

That is useful reuse, but it is not free capacity accounting. A VM costs more than the memory assigned to its guest: the launcher, virtualization processes, and supporting components also consume resources. We still have to budget for those costs.

### A lifecycle we can build around

Sandbox creation is not one infallible command. A request can succeed at one step and fail at the next. A controller can observe what exists and keep working toward the requested state, rather than relying on the original request handler to stay alive until everything finishes.

KubeVirt gives us that model for VM lifecycle. Our product still has to define what "ready," "stopped," and "deleted" mean to a sandbox user. A running VM is not necessarily ready to execute a command, and a deleted API object is not sufficient proof that an unreachable machine has stopped writing to storage.

The benefit is a foundation for that work, not its disappearance.

### Existing policy and integration points

Kubernetes provides role-based access control, admission policies that can reject unwanted configurations, and established networking and storage interfaces. Keeping VMs in that ecosystem lets us build on those mechanisms rather than create a parallel set just for VM workloads.

Those mechanisms need VM-aware configuration. A namespace alone is not tenant isolation. Network restrictions must cover the guest's actual traffic path. Persistent storage still needs correct ownership and safe cleanup.

For us, sharing the platform means reusing useful machinery while preserving the sandbox's security requirements—not assuming that every container policy automatically covers a VM.

## Why not use a hypervisor platform directly?

A dedicated virtualization platform can already provide scheduling, storage integration, permissions, and recovery tools. Kubernetes did not invent any of those capabilities.

The deciding factor for us was **where we wanted to integrate the sandbox lifecycle**. A separate VM platform would introduce another management API and another set of lifecycle semantics to connect to our product. KubeVirt lets that work stay centered on Kubernetes resources and controllers.

Likewise, managing QEMU directly would give us more control, but would also make us responsible for more of the machinery around it. Our goal is to build useful agent workspaces, not a general-purpose VM manager.

That does not make KubeVirt the universal answer. If we only needed a few long-lived VMs, or already had a dedicated virtualization platform that met the product's needs, the balance could be different.

## What we still need to operate well

Providing a complete machine means managing its boot process, resources, images, and updates. Those are engineering responsibilities that come with the capability we want to offer. Startup time and memory use still matter, but our goal is to deliver a useful agent environment—not minimize its footprint by removing the machine behavior the workload needs.

KubeVirt adds controllers and node-level components, some of which require elevated host access. The guest boundary does not make that supporting stack harmless or immune to vulnerabilities.

We also still own the sandbox-specific problems: authenticating commands, protecting credentials, restricting communication, deciding what state persists, and proving cleanup works after failures. KubeVirt does not supply a complete sandbox security model.

The combination we chose is **full Linux guest behavior for agents, with Kubernetes-managed lifecycle around it**. Full VM capability is the reason for that choice; operating it securely and efficiently is the work that follows. Isolation still needs deliberate design and testing.

## The choice in one sentence

**We chose KubeVirt for BoxCompute's VM sandboxes because we wanted to give workloads a real Linux machine while keeping the surrounding management in Kubernetes.**

QEMU/KVM supplies the VM. KubeVirt connects its lifecycle to Kubernetes. We remain responsible for turning that machine into a safe, usable sandbox.

For another part of that boundary, see [KubeVirt, VSOCK, and eBPF: who does what?](/blog/kubevirt-vsock-ebpf/).

## Further reading

- [KubeVirt architecture](https://kubevirt.io/user-guide/architecture/): VM resources, launcher Pods, and controllers.
- [Kubernetes controllers](https://kubernetes.io/docs/concepts/architecture/controller/): how desired-state reconciliation works.
- [Kubernetes scheduling](https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/): how workloads are placed on nodes.
