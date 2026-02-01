import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Using standard fonts for now to ensure stability
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica', // Standard font
        color: '#333333',
        paddingBottom: 80 // Space for footer
    },
    // Banner
    banner: {
        backgroundColor: '#ef4444', // Red
        height: 50, // Reduced height (half of previous ~80)
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40
    },
    logo: {
        width: 120, // Slightly smaller to fit
        objectFit: 'contain',
    },
    bannerText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold', // Helvetica bold
        textTransform: 'none'
    },
    // Info Section
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        marginBottom: 40
    },
    leftInfo: {
        width: '55%'
    },
    rightInfo: {
        width: '40%',
        alignItems: 'flex-end',
        textAlign: 'right'
    },
    // Info Rows
    infoRow: {
        flexDirection: 'row',
        marginBottom: 4
    },
    infoLabel: {
        width: 80,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#333333'
    },
    infoValue: {
        flex: 1,
        fontSize: 10,
        color: '#555555'
    },
    // Sender Right Side
    senderName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#444444',
        marginBottom: 5
    },
    senderText: {
        fontSize: 10,
        color: '#555555',
        marginBottom: 2
    },
    // Table (Cleaner Design)
    table: {
        marginHorizontal: 40,
        marginBottom: 40
    },
    tableRowHeader: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: '#f3f4f6', // very light gray
        paddingBottom: 8,
        marginBottom: 8
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f9fafb', // ultra light gray
        paddingVertical: 8
    },
    // Columns - Description Left, Price Right
    colConcept: {
        width: '55%',
    },
    colPrice: {
        width: '15%',
        alignItems: 'flex-end'
    },
    colDiscount: {
        width: '15%',
        alignItems: 'flex-end',
        color: '#ef4444' // Red color for discount
    },
    colTotal: {
        width: '15%',
        alignItems: 'flex-end',
        fontWeight: 'bold'
    },
    thText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#9ca3af', // gray-400
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    tdText: {
        fontSize: 10,
        color: '#374151' // gray-700
    },
    // Total
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
        marginRight: 40,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6'
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        marginRight: 20,
        color: '#333333'
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827'
    },
    // Footer (Bank Details at Bottom)
    footerAbsolute: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
    },
    bankLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#9ca3af',
        marginBottom: 2
    },
    bankValue: {
        fontSize: 9,
        color: '#4b5563',
        marginBottom: 8
    },
    bankGroup: {
        marginBottom: 4
    }
});

interface InvoicePDFProps {
    data: {
        number: string
        date: string
        logoBase64?: string
        company: {
            name: string
            businessName: string
            cif: string
            address: string
        }
        items: Array<{ description: string, price: number, discount?: number }>
        subtotal?: number
        taxRate?: number
        taxAmount?: number
        withholdingRate?: number
        withholdingAmount?: number
        total: number
        settings: {
            companyName: string
            commercialName?: string
            companyAddress: string
            companyEmail?: string
            companyTaxId?: string
            taxIdLabel?: string
            bankBeneficiary: string
            bankIban: string
            bankName: string
            bankAddress?: string
            bankSwift: string
        }
    }
}

export const InvoicePDF = ({ data }: InvoicePDFProps) => {
    const hasDiscount = data.items.some(item => (item.discount || 0) > 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* --- RED BANNER HEADER --- */}
                <View style={styles.banner}>
                    {data.logoBase64 ? (
                        <Image src={data.logoBase64} style={styles.logo} />
                    ) : (
                        <Text style={styles.bannerText}>
                            {data.settings.commercialName || "BuzzMarketing"}
                        </Text>
                    )}
                </View>

                {/* --- INFO SECTION --- */}
                <View style={styles.infoContainer}>
                    {/* LEFT: Invoice & Client Data */}
                    <View style={styles.leftInfo}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Factura:</Text>
                            <Text style={styles.infoValue}>{data.number}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Fecha:</Text>
                            <Text style={styles.infoValue}>{data.date}</Text>
                        </View>
                        <View style={[styles.infoRow, { marginTop: 10 }]}>
                            <Text style={styles.infoLabel}>CIF:</Text>
                            <Text style={styles.infoValue}>{data.company.cif}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Razón social:</Text>
                            <Text style={styles.infoValue}>{data.company.businessName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Dirección:</Text>
                            <Text style={styles.infoValue}>{data.company.address}</Text>
                        </View>
                    </View>

                    {/* RIGHT: Sender Data */}
                    <View style={styles.rightInfo}>
                        {data.settings.commercialName && (
                            <Text style={styles.senderName}>{data.settings.commercialName}</Text>
                        )}
                        <Text style={data.settings.commercialName ? styles.senderText : styles.senderName}>
                            {data.settings.companyName || "Buzz Marketing LLC"}
                        </Text>
                        <Text style={styles.senderText}>{data.settings.companyAddress}</Text>
                        <Text style={[styles.senderText, { marginTop: 5 }]}>Email: {data.settings.companyEmail}</Text>
                        <Text style={styles.senderText}>
                            {data.settings.taxIdLabel || "EIN"}: {data.settings.companyTaxId}
                        </Text>
                    </View>
                </View>

                {/* --- TABLE (Clean) --- */}
                <View style={styles.table}>
                    <View style={styles.tableRowHeader}>
                        <View style={hasDiscount ? styles.colConcept : { width: '75%' }}>
                            <Text style={styles.thText}>Servicio</Text>
                        </View>
                        <View style={hasDiscount ? styles.colPrice : { width: '25%', alignItems: 'flex-end' }}>
                            <Text style={styles.thText}>Precio</Text>
                        </View>
                        {hasDiscount && (
                            <>
                                <View style={styles.colDiscount}>
                                    <Text style={styles.thText}>Dto.</Text>
                                </View>
                                <View style={styles.colTotal}>
                                    <Text style={styles.thText}>Total</Text>
                                </View>
                            </>
                        )}
                    </View>

                    {data.items.map((item, i) => {
                        const discount = item.discount || 0
                        const finalPrice = discount > 0 ? item.price * ((100 - discount) / 100) : item.price

                        return (
                            <View key={i} style={styles.tableRow}>
                                <View style={hasDiscount ? styles.colConcept : { width: '75%' }}>
                                    <Text style={styles.tdText}>{item.description}</Text>
                                </View>
                                <View style={hasDiscount ? styles.colPrice : { width: '25%', alignItems: 'flex-end' }}>
                                    <Text style={styles.tdText}>{item.price.toFixed(2)} €</Text>
                                </View>
                                {hasDiscount && (
                                    <>
                                        <View style={styles.colDiscount}>
                                            <Text style={{ ...styles.tdText, color: '#ef4444' }}>{discount > 0 ? `-${discount}%` : ''}</Text>
                                        </View>
                                        <View style={styles.colTotal}>
                                            <Text style={{ ...styles.tdText, fontWeight: 'bold' }}>{finalPrice.toFixed(2)} €</Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        )
                    })}
                </View>

                {/* --- TOTAL --- */}
                <View style={{ marginTop: 20, marginRight: 40, alignItems: 'flex-end' }}>

                    {/* Breakdown Rows */}
                    {(data.taxAmount || data.withholdingAmount) ? (
                        <>
                            <View style={{ flexDirection: 'row', marginBottom: 4, width: 200, justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 10, color: '#333' }}>Importe base</Text>
                                <Text style={{ fontSize: 10, color: '#333' }}>{data.subtotal?.toFixed(2)} €</Text>
                            </View>

                            {(data.withholdingAmount ?? 0) > 0 && (
                                <View style={{ flexDirection: 'row', marginBottom: 4, width: 200, justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 10, color: '#333' }}>Retención {data.withholdingRate?.toFixed(0)}%</Text>
                                    <Text style={{ fontSize: 10, color: '#333' }}>-{data.withholdingAmount?.toFixed(2)} €</Text>
                                </View>
                            )}

                            {(data.taxAmount ?? 0) > 0 && (
                                <View style={{ flexDirection: 'row', marginBottom: 4, width: 200, justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 10, color: '#333' }}>IVA {data.taxRate?.toFixed(0)}%</Text>
                                    <Text style={{ fontSize: 10, color: '#333' }}>{data.taxAmount?.toFixed(2)} €</Text>
                                </View>
                            )}

                            <View style={{ height: 1, backgroundColor: '#f3f4f6', width: 200, marginVertical: 8 }} />
                        </>
                    ) : null}

                    <View style={{ flexDirection: 'row', width: 200, justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.totalLabel}>TOTAL</Text>
                        <Text style={styles.totalValue}>{data.total.toFixed(2)} €</Text>
                    </View>
                </View>

                {/* --- FOOTER: BANK INFO (Bottom) --- */}
                <View style={styles.footerAbsolute}>
                    {data.settings.bankBeneficiary && (
                        <View style={styles.bankGroup}>
                            <Text style={styles.bankLabel}>Beneficiario</Text>
                            <Text style={styles.bankValue}>{data.settings.bankBeneficiary}</Text>
                        </View>
                    )}

                    {data.settings.bankIban && (
                        <View style={styles.bankGroup}>
                            <Text style={styles.bankLabel}>Cuenta / IBAN</Text>
                            <Text style={styles.bankValue}>{data.settings.bankIban}</Text>
                        </View>
                    )}

                    {data.settings.bankName && (
                        <View style={styles.bankGroup}>
                            <Text style={styles.bankLabel}>Banco</Text>
                            <Text style={styles.bankValue}>{data.settings.bankName}</Text>
                        </View>
                    )}

                    {data.settings.bankAddress && (
                        <View style={styles.bankGroup}>
                            <Text style={styles.bankLabel}>Dirección del banco</Text>
                            <Text style={styles.bankValue}>{data.settings.bankAddress}</Text>
                        </View>
                    )}

                    {data.settings.bankSwift && (
                        <View style={styles.bankGroup}>
                            <Text style={styles.bankLabel}>SWIFT/BIC</Text>
                            <Text style={styles.bankValue}>{data.settings.bankSwift}</Text>
                        </View>
                    )}
                </View>
            </Page>
        </Document>
    );
}
