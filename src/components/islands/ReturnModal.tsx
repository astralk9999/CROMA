import React from 'react';

interface ReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
}

export default function ReturnModal({ isOpen, onClose, orderId }: ReturnModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal Panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                                </svg>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Devolución Pedido #{orderId.slice(0, 8)}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 mb-4">
                                        Lamentamos que no estés satisfecho con tu compra. Para proceder con la devolución, sigue estos pasos:
                                    </p>

                                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4 text-sm text-gray-700">
                                        <p className="font-bold mb-1">Dirección de Envío:</p>
                                        <p>Calle de la Moda 123</p>
                                        <p>Polígono Industrial</p>
                                        <p>28000, Madrid, España</p>
                                    </div>

                                    <ul className="text-sm text-gray-500 list-disc list-inside space-y-1 mb-4">
                                        <li>Envía los artículos en su embalaje original.</li>
                                        <li>Incluye el albarán de entrega dentro del paquete.</li>
                                    </ul>

                                    <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-md">
                                        <strong>Información Importante:</strong>
                                        <br />
                                        Una vez recibido y validado el paquete, el reembolso se procesará en tu método de pago original en un plazo de 5 a 7 días hábiles.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Entendido
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
