export default function SectionHeading({ id, eyebrow, strong, rest }) {
  return (
    <>
      {eyebrow ? (
        <p data-slot="section-eyebrow">
          <span aria-hidden="true">#</span> {eyebrow}
        </p>
      ) : null}
      <h2 data-slot="section-title" id={id ? `${id}-title` : undefined}>
        <a data-slot="heading-link" href={id ? `#${id}` : undefined}>
          <span data-slot="heading-anchor" aria-hidden="true">
            #
          </span>
          <strong>{strong}</strong>
          {rest ? ` ${rest}` : null}
        </a>
      </h2>
    </>
  )
}
