<Button
  variant="destructive"
  size="sm"
  onClick={async () => {
    if (confirm("Are you sure you want to delete this package?")) {
      await fetch(`/api/packages/${pkg.id}`, {
        method: "DELETE",
      });
      refetchAll();
    }
  }}
>
  Delete
</Button>;
{
  pkg.source === "rfid" && (
    <span
      style={{
        display: "inline-block",
        background: "#e0e7ff",
        color: "#3730a3",
        borderRadius: "6px",
        padding: "2px 8px",
        marginLeft: "8px",
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.05em",
      }}
    >
      RFID
    </span>
  );
}
