export function Spinner() {
  return <div className="spinner" />;
}

export function LoadingCenter() {
  return (
    <div className="loading-center">
      <Spinner />
    </div>
  );
}
