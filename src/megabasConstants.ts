// Defines contants to use to access Megabas
class MegabasConstants {
	// The hardware base address
	public static HW_ADD = 0x48;

	// Access to dry contact status
	public static DRY_CONTACT_VAL_ADD = 3;
	// 0-10 Volt Input Port 1
	public static U0_10_IN_VAL1_ADD = 12;

	// 0-10 Volt output 1
	public static U0_10_OUT_VAL1_ADD = 4;
	// 0-10 Volt output 2
	public static U0_10_OUT_VAL2_ADD = 6;
	// 0-10 Volt output 3
	public static U0_10_OUT_VAL3_ADD = 8;
	// 0-10 Volt output 4
	public static U0_10_OUT_VAL4_ADD = 10;
}
export { MegabasConstants };
