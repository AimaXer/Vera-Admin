import type {ReactNode} from 'react';

type ModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function Modal({title, children, onClose}: ModalProps): React.JSX.Element {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title">
        <h2 id="modal-title" style={{fontSize: 18, fontWeight: 800, marginBottom: 16}}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
